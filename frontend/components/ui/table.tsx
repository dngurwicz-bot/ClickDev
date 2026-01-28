import * as React from "react"
import { cn } from "@/lib/utils"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
    variant?: 'default' | 'hilan'
}

const Table = React.forwardRef<
    HTMLTableElement,
    TableProps
>(({ className, variant = 'default', ...props }, ref) => (
    <div className={cn(
        "relative w-full overflow-auto",
        variant === 'hilan' && "border border-gray-400 bg-white"
    )}>
        <table
            ref={ref}
            className={cn(
                "w-full caption-bottom",
                variant === 'hilan' ? "border-collapse text-[12px] [dir=rtl] text-right" : "text-sm",
                className
            )}
            {...props}
        />
    </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement> & { variant?: 'default' | 'hilan' }
>(({ className, variant = 'default', ...props }, ref) => (
    <thead 
        ref={ref} 
        className={cn(
            variant === 'hilan' 
                ? "bg-[#c0c0c0] sticky top-0 [&_tr]:border-b [&_tr]:border-gray-400" 
                : "[&_tr]:border-b", 
            className
        )} 
        {...props} 
    />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
    />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement> & { variant?: 'default' | 'hilan' }
>(({ className, variant = 'default', ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            variant === 'hilan'
                ? "bg-[#f0f0f0] border-t border-gray-400 font-bold text-[11px]"
                : "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
            className
        )}
        {...props}
    />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement> & { variant?: 'default' | 'hilan', striped?: boolean }
>(({ className, variant = 'default', striped = false, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            variant === 'hilan'
                ? "border-b border-gray-300 last:border-b-0 h-6 hover:bg-[#e0f0f0] transition-colors"
                : "border-b transition-colors hover:bg-muted/50",
            striped && "odd:bg-white even:bg-[#f5f5f5]",
            className
        )}
        {...props}
    />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement> & { variant?: 'default' | 'hilan' }
>(({ className, variant = 'default', ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            variant === 'hilan'
                ? "px-1 py-1 text-[11px] font-bold text-black border-l border-gray-400 last:border-l-0 bg-[#c0c0c0] align-middle h-6"
                : "h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement> & { variant?: 'default' | 'hilan' }
>(({ className, variant = 'default', ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            variant === 'hilan'
                ? "px-1 py-0 text-[11px] border-l border-gray-300 last:border-l-0 truncate align-middle h-6"
                : "p-4 align-middle [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
    HTMLTableCaptionElement,
    React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn("mt-4 text-sm text-muted-foreground", className)}
        {...props}
    />
))
TableCaption.displayName = "TableCaption"

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
}
