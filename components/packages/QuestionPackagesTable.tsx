"use client"

import Link from "next/link"
import * as React from "react"

import { useQuestionPackagesQuery } from "@/lib/hooks/useQuestionPackagesQuery"
import type { QuestionPackage } from "@/lib/types/question-packages"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ActiveFilter = "all" | "active" | "inactive"

function contains(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase())
}

function ActiveBadge({ active }: { active?: boolean | null }) {
  if (active === false) return <Badge variant="muted">Nonaktif</Badge>
  return <Badge variant="success">Aktif</Badge>
}

export function QuestionPackagesTable() {
  const { qPkgs } = useQuestionPackagesQuery()

  const [qText, setQText] = React.useState("")
  const [active, setActive] = React.useState<ActiveFilter>("all")

  React.useEffect(() => {
    // kalau nanti kamu nambah pagination client-side, reset page di sini
  }, [qText, active])

  const rows = React.useMemo(() => {
    const allRows = qPkgs.data?.data ?? []
    let r = [...allRows]

    if (active !== "all") {
      const isActive = active === "active"
      r = r.filter((x) => x.is_active === isActive)
    }

    const q = qText.trim()
    if (q) {
      r = r.filter((x) => contains(x.name, q) || contains(x.moodle_group_name, q))
    }

    r.sort((a, b) => a.id - b.id)
    return r
  }, [qPkgs.data, qText, active])

  const busy = qPkgs.isFetching

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <Input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Cari paket (nama / moodle group)"
            className="lg:w-65"
          />

          <select
            className="h-9 rounded-md border bg-background px-3 text-sm lg:w-65"
            value={active}
            onChange={(e) => setActive(e.target.value as ActiveFilter)}
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setQText("")
              setActive("all")
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Moodle Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  {qPkgs.isLoading ? "Memuat..." : "Data tidak ditemukan"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((it: QuestionPackage, idx: number) => (
                <TableRow key={it.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{it.name}</TableCell>
                  <TableCell>{it.moodle_group_name}</TableCell>
                  <TableCell>
                    <ActiveBadge active={it.is_active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/admin/question-packages/${it.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan <span className="font-medium text-foreground">{rows.length}</span> data
        </div>
        <div />
      </div>
    </div>
  )
}
