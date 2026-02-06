-- Fix Birth Date Persistence
-- Update create_employee_event to include birth_date update logic in the main employee table update.

CREATE OR REPLACE FUNCTION create_employee_event(
    p_organization_id uuid,
    p_employee_number text,
    p_id_number text,
    p_operation_code text, -- ' ', '2', '3', '4'
    p_event_data jsonb,
    p_user_id uuid,
    p_event_code text DEFAULT '200'
) RETURNS jsonb AS $$
DECLARE
    v_employee_id uuid;
    v_event_id uuid;
    v_effective_from DATE;
    v_next_valid_from DATE;
    v_current_first_name text;
    v_current_last_name text;
    
    -- Record holders for logic
    v_existing_addr employee_address%ROWTYPE;
    v_covering_addr employee_address%ROWTYPE;
    v_existing_hist employee_name_history%ROWTYPE;
    v_covering_hist employee_name_history%ROWTYPE;
BEGIN
    -- 1. Resolve Employee ID
    IF p_operation_code = ' ' AND p_event_code = '200' THEN
        -- New Employee Logic
         SELECT id INTO v_employee_id FROM employees 
         WHERE organization_id = p_organization_id AND id_number = p_id_number;
         
         IF FOUND THEN
             RETURN json_build_object('success', false, 'error', 'העובד כבר קיים במערכת');
         END IF;
         
         INSERT INTO employees (
            organization_id, employee_number, id_number, 
            first_name_he, last_name_he, birth_date, 
            created_by, is_active
        ) VALUES (
            p_organization_id, p_employee_number, p_id_number,
            p_event_data->>'firstName', p_event_data->>'lastName', (p_event_data->>'birthDate')::date,
            p_user_id, true
        ) RETURNING id INTO v_employee_id;
        
        -- Also create initial history record
        INSERT INTO employee_name_history (employee_id, first_name_he, last_name_he, effective_from, changed_by, reason)
        VALUES (v_employee_id, p_event_data->>'firstName', p_event_data->>'lastName', (p_event_data->>'birthDate')::date, p_user_id, 'Initial Creation');

        -- Update father_name_he if provided during creation
        IF p_event_data ? 'fatherName' THEN
            UPDATE employees SET father_name_he = p_event_data->>'fatherName' WHERE id = v_employee_id;
        END IF;

    ELSE
        -- Existing Employee Lookup
        SELECT id, first_name_he, last_name_he 
        INTO v_employee_id, v_current_first_name, v_current_last_name
        FROM employees 
        WHERE organization_id = p_organization_id 
        AND (id_number = p_id_number OR employee_number = p_employee_number);
        
        IF NOT FOUND THEN
             RETURN json_build_object('success', false, 'error', 'לא נמצא עובד');
        END IF;

        -- Handle Deletion (Gria 3) for Event 200
        IF p_operation_code = '3' AND p_event_code = '200' THEN
             UPDATE employees SET
                is_active = false,
                deleted_at = NOW(),
                -- Add timestamp suffix to avoid unique constraint collisions on re-entry
                employee_number = employee_number || '_DEL_' || extract(epoch from now())::text,
                id_number = id_number || '_DEL_' || extract(epoch from now())::text
             WHERE id = v_employee_id;

             -- Log and return
             INSERT INTO employee_events (
                organization_id, employee_id, event_code, operation_code, 
                event_data, created_by, processed
             ) VALUES (
                p_organization_id, v_employee_id, p_event_code, p_operation_code,
                p_event_data, p_user_id, true
             );

             RETURN json_build_object('success', true, 'employee_id', v_employee_id);
        END IF;
    END IF;

    -- 2. Handle Event 100 (Name History / 552)
    IF p_event_code = '100' THEN
        v_effective_from := COALESCE((p_event_data->>'effectiveFrom')::date, CURRENT_DATE);
        
        -- Operation ' ': Rishum (Add)
        IF p_operation_code = ' ' THEN
            -- Check exact match
            SELECT * INTO v_existing_hist FROM employee_name_history WHERE employee_id = v_employee_id AND effective_from = v_effective_from;
            
            IF FOUND THEN
                UPDATE employee_name_history SET
                    first_name_he = COALESCE(p_event_data->>'firstName', first_name_he),
                    last_name_he = COALESCE(p_event_data->>'lastName', last_name_he),
                    changed_by = p_user_id,
                    reason = 'Name Update (Rishum Override)'
                WHERE id = v_existing_hist.id;
            ELSE
                -- Check for FUTURE event
                IF EXISTS (SELECT 1 FROM employee_name_history WHERE employee_id = v_employee_id AND effective_from > v_effective_from) THEN
                    RETURN json_build_object('success', false, 'error', 'לא ניתן לבצע רישום (Add) כאשר קיימת רשומה עתידית. יש להשתמש בקוד אכיפה (4).');
                END IF;

                -- Close previous
                UPDATE employee_name_history 
                SET effective_to = v_effective_from - 1
                WHERE employee_id = v_employee_id AND (effective_to IS NULL OR effective_to >= v_effective_from) AND effective_from < v_effective_from;
                
                -- Insert new
                INSERT INTO employee_name_history (employee_id, first_name_he, last_name_he, effective_from, changed_by, reason)
                VALUES (v_employee_id, p_event_data->>'firstName', p_event_data->>'lastName', v_effective_from, p_user_id, 'Name Change (Rishum)');
            END IF;

        -- Operation '2': Tiuv (Update / Split)
        ELSIF p_operation_code = '2' THEN
            SELECT * INTO v_existing_hist FROM employee_name_history WHERE employee_id = v_employee_id AND effective_from = v_effective_from;
            
            IF FOUND THEN
                -- Exact Update
                UPDATE employee_name_history SET
                    first_name_he = COALESCE(p_event_data->>'firstName', first_name_he),
                    last_name_he = COALESCE(p_event_data->>'lastName', last_name_he),
                    changed_by = p_user_id,
                    reason = 'Name Correction'
                WHERE id = v_existing_hist.id;
            ELSE
                -- Split Logic: Find covering record
                SELECT * INTO v_covering_hist FROM employee_name_history 
                WHERE employee_id = v_employee_id AND effective_from < v_effective_from AND (effective_to IS NULL OR effective_to >= v_effective_from)
                ORDER BY effective_from DESC LIMIT 1;
                
                -- Try to find NEXT record to cap if needed (Historical Split)
                SELECT effective_from INTO v_next_valid_from FROM employee_name_history
                WHERE employee_id = v_employee_id AND effective_from > v_effective_from
                ORDER BY effective_from ASC LIMIT 1;

                IF FOUND THEN
                    -- Split: Close Old
                    UPDATE employee_name_history SET effective_to = v_effective_from - 1 WHERE id = v_covering_hist.id;
                    
                    -- Insert New (Copy old values if not provided)
                    INSERT INTO employee_name_history (employee_id, first_name_he, last_name_he, effective_from, effective_to, changed_by, reason)
                    VALUES (
                        v_employee_id,
                        COALESCE(p_event_data->>'firstName', v_covering_hist.first_name_he),
                        COALESCE(p_event_data->>'lastName', v_covering_hist.last_name_he),
                        v_effective_from,
                        CASE WHEN v_next_valid_from IS NOT NULL THEN v_next_valid_from - 1 ELSE NULL END, -- Cap if future exists
                        p_user_id,
                        'Name Split'
                    );
                ELSE
                    -- Treat as Insert (Gap). Also Check Future.
                    IF v_next_valid_from IS NOT NULL THEN
                           -- Gap Insert, Capped
                           INSERT INTO employee_name_history (employee_id, first_name_he, last_name_he, effective_from, effective_to, changed_by, reason)
                           VALUES (
                                v_employee_id, p_event_data->>'firstName', p_event_data->>'lastName', 
                                v_effective_from, v_next_valid_from - 1, 
                                p_user_id, 'Name Insert (Gap, Capped)'
                           );
                    ELSE
                           -- Normal Insert
                           INSERT INTO employee_name_history (employee_id, first_name_he, last_name_he, effective_from, changed_by, reason)
                           VALUES (v_employee_id, p_event_data->>'firstName', p_event_data->>'lastName', v_effective_from, p_user_id, 'Name Insert (Gap)');
                    END IF;
                END IF;
            END IF;

        -- Operation '3': Gria (Cancel / Close)
        ELSIF p_operation_code = '3' THEN
            -- Check exact match
            SELECT * INTO v_existing_hist FROM employee_name_history WHERE employee_id = v_employee_id AND effective_from = v_effective_from;
            
            IF FOUND THEN
                -- Find successor (Next record)
                SELECT effective_from INTO v_next_valid_from FROM employee_name_history
                WHERE employee_id = v_employee_id AND effective_from > v_effective_from
                ORDER BY effective_from ASC LIMIT 1;

                -- Delete exact event
                DELETE FROM employee_name_history WHERE id = v_existing_hist.id;

                -- Update Predecessor (Previous record) to extend to:
                -- 1. Next record's start - 1 (if exists)
                -- 2. NULL (infinity) if no next record
                UPDATE employee_name_history 
                SET effective_to = CASE 
                    WHEN v_next_valid_from IS NOT NULL THEN v_next_valid_from - 1 
                    ELSE NULL 
                END
                WHERE employee_id = v_employee_id 
                AND effective_from < v_effective_from 
                -- Target the immediately preceding record
                AND id = (
                    SELECT id FROM employee_name_history 
                    WHERE employee_id = v_employee_id AND effective_from < v_effective_from 
                    ORDER BY effective_from DESC LIMIT 1
                );

            ELSE
                -- Close Validity of covering event
                UPDATE employee_name_history SET effective_to = v_effective_from - 1
                WHERE employee_id = v_employee_id AND effective_from < v_effective_from AND (effective_to IS NULL OR effective_to >= v_effective_from);
            END IF;

        -- Operation '4': Achifa (Set / Force)
        ELSIF p_operation_code = '4' THEN
            -- Force Insert: Delete ALL future records (Reset from this date)
            DELETE FROM employee_name_history 
            WHERE employee_id = v_employee_id AND effective_from >= v_effective_from;
            
            -- Close previous record (if exists)
            UPDATE employee_name_history 
            SET effective_to = v_effective_from - 1
            WHERE employee_id = v_employee_id AND effective_from < v_effective_from AND (effective_to IS NULL OR effective_to >= v_effective_from);

            -- Insert New (Open Ended)
            INSERT INTO employee_name_history (employee_id, first_name_he, last_name_he, effective_from, effective_to, changed_by, reason)
            VALUES (
                v_employee_id, p_event_data->>'firstName', p_event_data->>'lastName', 
                v_effective_from, 
                NULL, -- Always open ended as it wiped the future
                p_user_id, 'Historical Force (Reset)'
            );
        END IF;

        -- Update Main Employee Table
        UPDATE employees SET
            first_name_he = (SELECT first_name_he FROM employee_name_history WHERE employee_id = v_employee_id AND effective_from <= CURRENT_DATE ORDER BY effective_from DESC LIMIT 1),
            last_name_he = (SELECT last_name_he FROM employee_name_history WHERE employee_id = v_employee_id AND effective_from <= CURRENT_DATE ORDER BY effective_from DESC LIMIT 1),
            -- Also update father_name_he directly as it's not currently history-tracked
            father_name_he = COALESCE(p_event_data->>'fatherName', father_name_he),
            -- Fix: Update birth_date if provided
            birth_date = COALESCE((p_event_data->>'birthDate')::date, birth_date)
        WHERE id = v_employee_id;
        
    END IF;

    -- 3. Handle Event 101 (Address / 218)
    IF p_event_code = '101' THEN
        v_effective_from := COALESCE((p_event_data->>'effectiveFrom')::date, CURRENT_DATE);

        -- Operation ' ': Rishum
        IF p_operation_code = ' ' THEN
             SELECT * INTO v_existing_addr FROM employee_address WHERE employee_id = v_employee_id AND valid_from = v_effective_from;
             
             IF FOUND THEN
                 -- Update existing
                 UPDATE employee_address SET
                    city_name = COALESCE(p_event_data->>'cityName', city_name),
                    street = COALESCE(p_event_data->>'street', street),
                    house_number = COALESCE(p_event_data->>'houseNumber', house_number),
                    changed_by = p_user_id
                 WHERE id = v_existing_addr.id;
             ELSE
                 -- Check for FUTURE event
                 IF EXISTS (SELECT 1 FROM employee_address WHERE employee_id = v_employee_id AND valid_from > v_effective_from) THEN
                      RETURN json_build_object('success', false, 'error', 'לא ניתן לבצע רישום (Add) כאשר קיימת רשומה עתידית. יש להשתמש בקוד אכיפה (4).');
                 END IF;

                 -- Close previous
                 UPDATE employee_address 
                 SET valid_to = v_effective_from - 1
                 WHERE employee_id = v_employee_id AND (valid_to IS NULL OR valid_to >= v_effective_from) AND valid_from < v_effective_from;
                 
                 -- Insert
                 INSERT INTO employee_address (
                    employee_id, organization_id, city_name, city_code, street, house_number, 
                    apartment, entrance, postal_code, phone, phone_additional, valid_from, changed_by
                 ) VALUES (
                    v_employee_id, p_organization_id,
                    p_event_data->>'cityName', p_event_data->>'cityCode', p_event_data->>'street', p_event_data->>'houseNumber', 
                    p_event_data->>'apartment', p_event_data->>'entrance', p_event_data->>'postalCode', 
                    p_event_data->>'phone', p_event_data->>'phoneAdditional',
                    v_effective_from, p_user_id
                 );
             END IF;

        -- Operation '2': Tiuv / Split
        ELSIF p_operation_code = '2' THEN
             SELECT * INTO v_existing_addr FROM employee_address WHERE employee_id = v_employee_id AND valid_from = v_effective_from;
             
             IF FOUND THEN
                 -- Exact Update
                 UPDATE employee_address SET
                    city_name = COALESCE(p_event_data->>'cityName', city_name),
                    city_code = COALESCE(p_event_data->>'cityCode', city_code),
                    street = COALESCE(p_event_data->>'street', street),
                    house_number = COALESCE(p_event_data->>'houseNumber', house_number),
                    apartment = COALESCE(p_event_data->>'apartment', apartment),
                    entrance = COALESCE(p_event_data->>'entrance', entrance),
                    postal_code = COALESCE(p_event_data->>'postalCode', postal_code),
                    phone = COALESCE(p_event_data->>'phone', phone),
                    phone_additional = COALESCE(p_event_data->>'phoneAdditional', phone_additional),
                    updated_at = NOW(),
                    changed_by = p_user_id
                 WHERE id = v_existing_addr.id;
             ELSE
                 -- Split Logic
                 SELECT * INTO v_covering_addr FROM employee_address 
                 WHERE employee_id = v_employee_id AND valid_from < v_effective_from AND (valid_to IS NULL OR valid_to >= v_effective_from)
                 ORDER BY valid_from DESC LIMIT 1;
                 
                 -- Find Next for Capping
                 SELECT valid_from INTO v_next_valid_from FROM employee_address
                 WHERE employee_id = v_employee_id AND valid_from > v_effective_from
                 ORDER BY valid_from ASC LIMIT 1;
                 
                 IF FOUND THEN
                     -- SPLIT: Close old
                     UPDATE employee_address SET valid_to = v_effective_from - 1 WHERE id = v_covering_addr.id;
                     
                     -- Insert New (Copy old fields + apply changes)
                     INSERT INTO employee_address (
                        employee_id, organization_id, 
                        city_name, 
                        city_code, 
                        street, 
                        house_number, 
                        apartment, entrance, postal_code, phone, phone_additional,
                        valid_from, valid_to, changed_by
                     ) VALUES (
                        v_employee_id, p_organization_id,
                        COALESCE(p_event_data->>'cityName', v_covering_addr.city_name),
                        COALESCE(p_event_data->>'cityCode', v_covering_addr.city_code),
                        COALESCE(p_event_data->>'street', v_covering_addr.street),
                        COALESCE(p_event_data->>'houseNumber', v_covering_addr.house_number),
                        COALESCE(p_event_data->>'apartment', v_covering_addr.apartment),
                        COALESCE(p_event_data->>'entrance', v_covering_addr.entrance),
                        COALESCE(p_event_data->>'postalCode', v_covering_addr.postal_code),
                        COALESCE(p_event_data->>'phone', v_covering_addr.phone),
                        COALESCE(p_event_data->>'phoneAdditional', v_covering_addr.phone_additional),
                        v_effective_from, 
                        CASE WHEN v_next_valid_from IS NOT NULL THEN v_next_valid_from - 1 ELSE NULL END,
                        p_user_id
                     );
                 ELSE
                     -- Gap Insert
                     INSERT INTO employee_address (
                        employee_id, organization_id, city_name, city_code, street, house_number, 
                        apartment, entrance, postal_code, phone, phone_additional, 
                        valid_from, valid_to, changed_by
                     ) VALUES (
                        v_employee_id, p_organization_id,
                        p_event_data->>'cityName', p_event_data->>'cityCode', p_event_data->>'street', p_event_data->>'houseNumber', 
                        p_event_data->>'apartment', p_event_data->>'entrance', p_event_data->>'postalCode', 
                        p_event_data->>'phone', p_event_data->>'phoneAdditional',
                        v_effective_from, 
                        CASE WHEN v_next_valid_from IS NOT NULL THEN v_next_valid_from - 1 ELSE NULL END,
                        p_user_id
                     );
                 END IF;
             END IF;

        -- Operation '3': Gria (Cancel / Close)
        ELSIF p_operation_code = '3' THEN
             SELECT * INTO v_existing_addr FROM employee_address WHERE employee_id = v_employee_id AND valid_from = v_effective_from;
             
             IF FOUND THEN
                 -- Find next for capping predecessor
                 SELECT valid_from INTO v_next_valid_from FROM employee_address
                 WHERE employee_id = v_employee_id AND valid_from > v_effective_from
                 ORDER BY valid_from ASC LIMIT 1;

                 -- Delete Exact
                 DELETE FROM employee_address WHERE id = v_existing_addr.id;

                 -- Update Predecessor
                 UPDATE employee_address 
                 SET valid_to = CASE 
                    WHEN v_next_valid_from IS NOT NULL THEN v_next_valid_from - 1
                    ELSE NULL -- If no future record, this becomes open-ended
                 END
                 WHERE employee_id = v_employee_id 
                 AND valid_from < v_effective_from 
                 AND id = (
                    SELECT id FROM employee_address
                    WHERE employee_id = v_employee_id AND valid_from < v_effective_from
                    ORDER BY valid_from DESC LIMIT 1
                 );
             ELSE
                 -- Close Validity
                 UPDATE employee_address SET valid_to = v_effective_from - 1
                 WHERE employee_id = v_employee_id AND valid_from < v_effective_from AND (valid_to IS NULL OR valid_to >= v_effective_from);
             END IF;

        -- Operation '4': Achifa (Set)
        ELSIF p_operation_code = '4' THEN
             -- Force Insert: Delete ALL future records (Reset from this date)
             DELETE FROM employee_address WHERE employee_id = v_employee_id AND valid_from >= v_effective_from;
             
             -- Close previous record (if exists)
             UPDATE employee_address 
             SET valid_to = v_effective_from - 1
             WHERE employee_id = v_employee_id AND valid_from < v_effective_from AND (valid_to IS NULL OR valid_to >= v_effective_from);
             
             -- Insert New (Open Ended)
             INSERT INTO employee_address (
                employee_id, organization_id, city_name, city_code, street, house_number, 
                apartment, entrance, postal_code, phone, phone_additional, valid_from, valid_to, changed_by
             ) VALUES (
                v_employee_id, p_organization_id,
                p_event_data->>'cityName', p_event_data->>'cityCode', p_event_data->>'street', p_event_data->>'houseNumber', 
                p_event_data->>'apartment', p_event_data->>'entrance', p_event_data->>'postalCode', 
                p_event_data->>'phone', p_event_data->>'phoneAdditional',
                v_effective_from, 
                NULL, -- Always open ended as it wiped the future
                p_user_id
             );
        END IF;
    END IF;

    -- 4. Log Event (Audit)
    INSERT INTO employee_events (
        organization_id, employee_id, event_code, operation_code, 
        event_data, created_by, processed
    ) VALUES (
        p_organization_id, v_employee_id, p_event_code, p_operation_code,
        p_event_data, p_user_id, true
    ) RETURNING id INTO v_event_id;

    RETURN json_build_object('success', true, 'employee_id', v_employee_id, 'event_id', v_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
