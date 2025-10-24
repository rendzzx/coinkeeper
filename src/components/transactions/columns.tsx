
"use client"

import type { ColumnDef, FilterFn, Row, Table, RowData } from "@tanstack/react-table"
import type { Transaction, Category, Tag } from "@/lib/types"
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  ArrowRightLeft,
  Paperclip,
  TagIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getCategoryName, getWalletName, formatDateTime } from "@/lib/utils"
import { useSettings } from "@/context/SettingsContext"
import { useWallet } from "@/context/WalletContext"
import { useTransaction } from "@/context/TransactionContext"
import { useTranslation } from "@/hooks/use-translation"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import type { TranslationKey } from "@/lib/i18n";


// Augment the TanStack Table interface to include our custom meta property
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    openEditForm: (transaction: TData) => void
  }
}

const ActionsCell = ({ row, table }: { row: Row<Transaction>; table: Table<Transaction> }) => {
  const { deleteTransaction } = useTransaction()
  const { t } = useTranslation()
  const transaction = row.original

  const handleDelete = () => {
    deleteTransaction(transaction.id)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
        >
          <span className="sr-only">{t("delete")}</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteTransactionWarning")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const dateBetweenFilterFn: FilterFn<any> = (row, columnId, value: DateRange, addMeta) => {
  const date = new Date(row.getValue(columnId))
  const { from, to } = value
  if ((from && !to) || (to && !from)) {
    const targetDate = from || to
    return isWithinInterval(date, { start: targetDate as Date, end: targetDate as Date })
  }
  if (from && to) {
    return isWithinInterval(date, { start: from, end: to })
  }
  return true
}

const amountRangeFilterFn: FilterFn<any> = (row, columnId, value: [string, string]) => {
  const amount = row.getValue(columnId) as number
  const [min, max] = value
  const minAmount = min ? parseFloat(min) : -Infinity
  const maxAmount = max ? parseFloat(max) : Infinity

  return amount >= minAmount && amount <= maxAmount
}

const arrayContainsFilterFn: FilterFn<any> = (row, columnId, value: string) => {
  const tags = row.getValue(columnId) as string[]
  return tags.includes(value)
}

const categoryFilterFn = (categories: Category[]): FilterFn<Transaction> => {
  return (row, columnId, value: string, addMeta) => {
    const transactionCategoryId = row.original.categoryId

    // If the selected filter value is a main category
    const mainCategory = categories.find((c) => c.id === value)
    if (mainCategory) {
      const allCategoryIds = [mainCategory.id, ...mainCategory.subcategories.map((sc) => sc.id)]
      return allCategoryIds.includes(transactionCategoryId)
    }

    // If the selected filter value is a subcategory (or no main category was found)
    return transactionCategoryId === value
  }
}

export const getColumns = (
  categories: Category[] = [],
  allTags: Tag[] = []
): ColumnDef<Transaction>[] => [
  {
    accessorKey: "type",
    header: () => {
      const { t } = useTranslation()
      return t("type")
    },
    cell: ({ row }) => {
      const type = row.getValue("type") as 'income' | 'expense'
      const { t } = useTranslation()

      const isIncome = type === "income"
      const isTransfer = !!row.original.transferId

      if (isTransfer) {
        return (
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            <span className="capitalize hidden sm:inline">{t("transfer")}</span>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2">
          {isIncome ? (
            <ArrowUp className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDown className="h-4 w-4 text-red-500" />
          )}
          <span className="capitalize hidden sm:inline">{t(type)}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      if (value === "transfer") {
        return !!row.original.transferId
      }
      return row.getValue(id) === value
    },
  },
  {
    accessorKey: "amount",
    header: () => {
      const { t } = useTranslation()
      return <div className="text-right">{t("amount")}</div>
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const { settings } = useSettings()
      const { currency, hideAmounts, numberFormat, decimalPlaces } = settings
      const formatted = formatCurrency(amount, currency, hideAmounts, numberFormat, decimalPlaces)
      const type = row.getValue("type") as string
      const isTransfer = !!row.original.transferId

      let amountClass = ""
      if (isTransfer) amountClass = "text-blue-600"
      else if (type === "income") amountClass = "text-green-600"

      return <div className={`text-right font-medium ${amountClass}`}>{formatted}</div>
    },
    filterFn: amountRangeFilterFn,
  },
  {
    accessorKey: "categoryId",
    accessorFn: (row) => row.categoryId,
    header: () => {
      const { t } = useTranslation()
      return t("category")
    },
    cell: ({ row }) => {
      const hasAttachment = row.original.attachments && row.original.attachments.length > 0
      return (
        <div className="flex items-center gap-2">
          <span>{getCategoryName(categories, row.original.categoryId)}</span>
          {hasAttachment && <Paperclip className="h-3 w-3 text-muted-foreground" />}
        </div>
      )
    },
    id: "category",
    filterFn: categoryFilterFn(categories),
  },
  {
    accessorKey: "walletId",
    id: "wallet",
    accessorFn: (row) => row.walletId,
    header: ({ column }) => {
      const { t } = useTranslation()
      return <div>{t("wallet")}</div>
    },
    cell: ({ row }) => {
      const { wallets } = useWallet()
      return <div>{getWalletName(wallets, row.original.walletId)}</div>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "date",
    header: () => {
      const { t } = useTranslation()
      return <div>{t("date")}</div>
    },
    cell: ({ row }) => {
      const { settings } = useSettings()
      return (
        <div>{formatDateTime(row.getValue("date"), settings.language, settings.timeFormat)}</div>
      )
    },
    filterFn: dateBetweenFilterFn,
  },
  {
    accessorKey: "tags",
    header: ({ column }) => {
      const { t } = useTranslation()
      return <div>{t("tags")}</div>
    },
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[]
      if (!tags || tags.length === 0) return <div></div>

      const getTagColor = (tagName: string) => {
        if (!Array.isArray(allTags)) return "#808080"
        return allTags.find((t) => t.name === tagName)?.color || "#808080"
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => {
            const color = getTagColor(tag)
            return (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1.5">
                <TagIcon size={12} fill={color} stroke="#fff" strokeWidth={2} />
                {tag}
              </Badge>
            )
          })}
        </div>
      )
    },
    filterFn: arrayContainsFilterFn,
  },
  {
    id: "actions",
    header: ({ column }) => {
      const { t } = useTranslation()
      return <div className="text-right hidden sm:table-cell">{t("actions")}</div>
    },
    cell: (props) => (
      <div className="text-right hidden sm:table-cell">
        <ActionsCell {...props} />
      </div>
    ),
  },
]
