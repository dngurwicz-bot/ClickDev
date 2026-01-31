"""
Analytics Router
Handles dashboard statistics and reporting.
"""

import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from database import supabase_admin  # pylint: disable=import-error
from dependencies import require_super_admin  # pylint: disable=import-error
from schemas import ReportRequest  # pylint: disable=import-error


router = APIRouter(prefix="/api/stats", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_stats(_user=Depends(require_super_admin)):
    """Get high-level dashboard statistics."""
    try:
        # Get total organizations
        orgs_response = supabase_admin.table("organizations")\
            .select("id, subscription_tier", count="exact").execute()
        total_orgs = len(orgs_response.data) if orgs_response.data else 0

        # Get active organizations
        active_orgs_response = supabase_admin.table("organizations")\
            .select("id", count="exact").eq("is_active", True).execute()
        active_orgs = len(active_orgs_response.data) \
            if active_orgs_response.data else 0

        # Calculate MRR (Estimated)
        mrr = 0
        if orgs_response.data:
            for org in orgs_response.data:
                tier = org.get("subscription_tier", "basic")
                if tier == "pro":
                    mrr += 50
                elif tier == "enterprise":
                    mrr += 200
                # basic is 0

        # Get Recent Activity (Last 5 created orgs)
        recent_activity_response = supabase_admin.table("organizations")\
            .select("id, name, created_at, is_active")\
            .order("created_at", desc=True).limit(5).execute()
        recent_activity = recent_activity_response.data \
            if recent_activity_response.data else []

        return {
            "total_organizations": total_orgs,
            "active_organizations": active_orgs,
            "mrr": mrr,
            "recent_activity": recent_activity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/analytics")
async def get_analytics_data(_user=Depends(require_super_admin)):
    """Get reporting analytics data."""
    try:
        # 1. Growth Data (Last 6 months)
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        current_month = datetime.now().month

        # Rotated months to show last 6
        display_months = []
        for i in range(5, -1, -1):
            idx = (current_month - 1 - i) % 12
            display_months.append(months[idx])

        # Get actual counts if possible, for now we mock the trend
        # Fetch actual totals
        orgs_response = supabase_admin.table("organizations")\
            .select("id, created_at, subscription_tier, is_active").execute()

        orgs = orgs_response.data if orgs_response.data else []
        total_orgs = len(orgs)

        # Mock growth data
        growth_data = [
            {
                "name": m,
                "organizations": int(total_orgs * (0.5 + 0.1 * i))
            }
            for i, m in enumerate(display_months)
        ]
        # Make the last one match actuals
        growth_data[-1]["organizations"] = total_orgs

        # 2. Distribution Data (Subscription Tiers)
        tiers = {"basic": 0, "pro": 0, "enterprise": 0}
        org_status = {"active": 0, "inactive": 0}

        for org in orgs:
            tier = org.get("subscription_tier", "basic")
            if tier in tiers:
                tiers[tier] += 1
            else:
                tiers["basic"] += 1  # Default or unknown

            if org.get("is_active"):
                org_status["active"] += 1
            else:
                org_status["inactive"] += 1

        distribution_data = [
            {"name": "Basic", "value": tiers["basic"]},
            {"name": "Pro", "value": tiers["pro"]},
            {"name": "Enterprise", "value": tiers["enterprise"]},
        ]

        # 3. Key Metrics
        inactive_orgs = org_status["inactive"]
        churn_rate = (inactive_orgs / total_orgs * 100) \
            if total_orgs > 0 else 0

        return {
            "growth_data": growth_data,
            "distribution_data": distribution_data,
            "metrics": {
                "churn_rate": round(churn_rate, 1),
                "total_orgs": total_orgs,
                "active_orgs": org_status["active"]
            }
        }
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error in analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/reports/generate")
async def generate_report(request: ReportRequest,
                          _user=Depends(require_super_admin)):
    """Generate and stream a CSV report."""
    try:
        output = io.StringIO()
        writer = csv.writer(output)

        if request.report_type == 'organizations':
            # Columns
            writer.writerow(
                ['ID', 'Name', 'Email', 'Subscription', 'Created At', 'Status']
            )

            # Fetch data (mock or real)
            query = supabase_admin.table("organizations")\
                .select("*").order("created_at", desc=True)
            if request.start_date:
                query = query.gte("created_at", request.start_date)
            if request.end_date:
                query = query.lte("created_at", request.end_date)

            response = query.execute()

            for org in response.data:
                writer.writerow([
                    org.get('id'),
                    org.get('name'),
                    org.get('email'),
                    org.get('subscription_tier'),
                    org.get('created_at'),
                    'Active' if org.get('is_active') else 'Inactive'
                ])

        else:
            raise HTTPException(status_code=400, detail="Invalid report type")

        output.seek(0)

        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv"
        )
        response.headers["Content-Disposition"] = \
            f"attachment; filename=report_{request.report_type}.csv"
        return response

    except Exception as e:  # pylint: disable=broad-except
        print(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
