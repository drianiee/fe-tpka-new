// components/layouts/PageHeaderLayout.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

type PageHeaderLayoutProps = {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  showBack?: boolean
  onBack?: (() => void) | undefined
}

export function PageHeaderLayout({
  title,
  description,
  children,
  actions,
  showBack = true,
  onBack,
}: PageHeaderLayoutProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {showBack ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => {
                if (onBack) {
                  onBack()
                  return
                }

                router.back()
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          ) : null}

          <div>
            <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {children}
    </div>
  )
}
