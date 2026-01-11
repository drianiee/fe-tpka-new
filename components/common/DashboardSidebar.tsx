"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  CalendarCheck,
  Handshake,
  Archive,
  ChevronDown,
  Package,
  CreditCard,
  Award,
} from "lucide-react"

import { Separator } from "@/components/ui/separator"
import type { User, UserRole } from "@/lib/types/auth"

type NavChild = { label: string; href: string }

type NavItem = {
  key: string
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavChild[]
  defaultOpen?: boolean
  exact?: boolean
}

function navByRole(role: UserRole): NavItem[] {
  if (role === "administrator") {
    return [
      { key: "dashboard", label: "Beranda", href: "/dashboard/admin", icon: LayoutGrid, exact: true },
      { key: "schedules", label: "Schedules", href: "/dashboard/admin/schedules", icon: CalendarCheck },
      { key: "mitra", label: "Mitra", href: "/dashboard/admin/mitra", icon: Handshake },
      { key: "packages", label: "Paket Soal", href: "/dashboard/admin/question-packages", icon: Package },
      { key: "payments", label: "Pembayaran", href: "/dashboard/admin/payments", icon: CreditCard },
      { key: "certificates", label: "Certificate", href: "/dashboard/admin/certificates", icon: Award },
      {
        key: "arsip",
        label: "Data Arsip",
        icon: Archive,
        defaultOpen: true,
        children: [
          { label: "Operator", href: "/dashboard/admin/operators" },
          { label: "Peserta", href: "/dashboard/admin/peserta" },
        ],
      },
    ]
  }

  if (role === "operator") {
    return [
      { key: "dashboard", label: "Beranda", href: "/dashboard/operator", icon: LayoutGrid, exact: true },
      { key: "schedules", label: "Schedules", href: "/dashboard/operator/schedules", icon: CalendarCheck },
      { key: "mitra", label: "Mitra", href: "/dashboard/operator/mitra", icon: Handshake },
      { key: "packages", label: "Paket Soal", href: "/dashboard/operator/question-packages", icon: Package },
      { key: "payments", label: "Pembayaran", href: "/dashboard/operator/payments", icon: CreditCard },      {
        key: "arsip",
        label: "Data Arsip",
        icon: Archive,
        defaultOpen: true,
        children: [
          { label: "Peserta", href: "/dashboard/operator/peserta" },
        ],
      },
    ]
  }

  return [
    { key: "dashboard", label: "Beranda", href: "/dashboard/peserta", icon: LayoutGrid, exact: true },
    { key: "my-schedules", label: "Jadwal Tes", href: "/dashboard/peserta/my-schedules", icon: CalendarCheck },
    { key: "certificates", label: "Certificate", href: "/dashboard/peserta/certificates", icon: Award },
  ]
}

function isActivePath(pathname: string, href?: string, exact?: boolean) {
  if (!href) return false
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

function computeInitialOpen(nav: NavItem[], pathname: string) {
  const acc: Record<string, boolean> = {}
  for (const item of nav) {
    const anyChildActive =
      (item.children?.length ?? 0) > 0 &&
      item.children!.some((c) => isActivePath(pathname, c.href))

    acc[item.key] = Boolean(item.defaultOpen) || Boolean(anyChildActive)
  }
  return acc
}

export function DashboardSidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const nav = React.useMemo(() => navByRole(user.role), [user.role])

  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() =>
    computeInitialOpen(nav, pathname)
  )

  React.useEffect(() => {
    setOpenSections((prev) => {
      let changed = false
      const next = { ...prev }

      for (const item of nav) {
        if (!item.children?.length) continue
        const anyChildActive = item.children.some((c) => isActivePath(pathname, c.href))
        if (anyChildActive && next[item.key] !== true) {
          next[item.key] = true
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [pathname, nav])

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const itemBase =
    "group w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors"
  const itemIdle = "text-slate-900 hover:bg-blue-50 hover:text-blue-900"
  const itemActive = "bg-blue-100 text-blue-900"
  const iconBase = "h-5 w-5 transition-colors"
  const iconIdle = "text-slate-900 group-hover:text-blue-900"
  const iconActive = "text-blue-900"

  const childBase = "rounded-xl px-3 py-2 text-sm transition-colors"
  const childIdle = "text-slate-900 hover:bg-blue-50 hover:text-blue-900"
  const childActive = "bg-blue-100 text-blue-900"

  return (
    <div className="p-4">
      <div className="md:hidden">
        <div className="font-semibold">TPKA</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {user.name} • {user.role}
        </div>
        <Separator className="my-4" />
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon
          const hasChildren = (item.children?.length ?? 0) > 0
          const anyChildActive = hasChildren && item.children!.some((c) => isActivePath(pathname, c.href))
          const active = isActivePath(pathname, item.href, item.exact) || Boolean(anyChildActive)
          const open = Boolean(openSections[item.key])

          if (!hasChildren) {
            return (
              <Link key={item.key} href={item.href ?? "#"} className="block">
                <div className={[itemBase, active ? itemActive : itemIdle].join(" ")}>
                  <div className="flex items-center gap-3">
                    <Icon className={[iconBase, active ? iconActive : iconIdle].join(" ")} />
                    <span className={active ? "font-medium" : undefined}>{item.label}</span>
                  </div>
                </div>
              </Link>
            )
          }

          return (
            <div key={item.key} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(item.key)}
                className={[itemBase, active ? itemActive : itemIdle].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <Icon className={[iconBase, active ? iconActive : iconIdle].join(" ")} />
                  <span className={active ? "font-medium" : undefined}>{item.label}</span>
                </div>

                <ChevronDown
                  className={[
                    "h-4 w-4 transition-transform",
                    open ? "rotate-180" : "rotate-0",
                    active ? "text-blue-900" : "text-slate-900 group-hover:text-blue-900",
                  ].join(" ")}
                />
              </button>

              {open ? (
                <div className="ml-3 border-l pl-3 space-y-1">
                  {item.children!.map((child) => {
                    const childIsActive = isActivePath(pathname, child.href)
                    return (
                      <Link key={child.href} href={child.href} className="block">
                        <div className={[childBase, childIsActive ? childActive : childIdle].join(" ")}>
                          <span className={childIsActive ? "font-medium" : undefined}>{child.label}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
