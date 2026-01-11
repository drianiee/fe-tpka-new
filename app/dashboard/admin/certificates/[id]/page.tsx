"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Stage, Layer, Rect, Text as KonvaText, Group, Image as KonvaImage } from "react-konva"
import useImage from "use-image"
import { ArrowLeft, Save, Power, Plus, Trash2, Loader2 } from "lucide-react"

import { certificateService } from "@/lib/services/certificate.service"
import type { Certificate, CertificateLayoutJson, CertificateTextAlign } from "@/lib/types/certificate"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { getApiErrorMessage } from "@/lib/api/errors"

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const DEFAULT_CANVAS = { width: 2000, height: 1414 }

const DEFAULT_FIELDS: CertificateLayoutJson["fields"] = {
  participant_name: { x: 1000, y: 600, fontSize: 72, align: "center" },
  certificate_no: { x: 220, y: 220, fontSize: 28, align: "left" },
  exam_date: { x: 1000, y: 720, fontSize: 34, align: "center" },
  score_verbal: { x: 1600, y: 300, fontSize: 30, align: "right" },
  score_kuantitatif: { x: 1600, y: 360, fontSize: 30, align: "right" },
  score_logika: { x: 1600, y: 420, fontSize: 30, align: "right" },
  score_spasial: { x: 1600, y: 480, fontSize: 30, align: "right" },
  score_total: { x: 1600, y: 540, fontSize: 34, align: "right" },
}

function parseAlign(v: string): CertificateTextAlign {
  const s = (v || "").trim().toLowerCase()
  if (s === "center") return "center"
  if (s === "right") return "right"
  return "left"
}

function previewText(key: string) {
  switch (key) {
    case "participant_name":
      return "Nama Peserta"
    case "certificate_no":
      return "001/TPKA/I/2026/1/2026"
    case "exam_date":
      return "2026-01-07"
    case "score_verbal":
      return "80"
    case "score_kuantitatif":
      return "75"
    case "score_logika":
      return "78"
    case "score_spasial":
      return "74"
    case "score_total":
      return "77"
    default:
      return key
  }
}

function estimateTextBoxWidth(text: string, fontSize: number) {
  return Math.max(160, text.length * fontSize * 0.6)
}

export default function AdminCertificateLayoutPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const certQ = useQuery({
    queryKey: [API_ENDPOINTS.ADMIN.CERTIFICATES.DETAIL(id ?? ""), id],
    queryFn: () => certificateService.get(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  })

  const [canvasW, setCanvasW] = React.useState(DEFAULT_CANVAS.width)
  const [canvasH, setCanvasH] = React.useState(DEFAULT_CANVAS.height)
  const [fields, setFields] = React.useState<CertificateLayoutJson["fields"]>({ ...DEFAULT_FIELDS })
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null)

  // init from API (layout_json)
  React.useEffect(() => {
    const cert = certQ.data as Certificate | undefined
    if (!cert) return

    const lj = cert.layout_json
    if (!lj) {
      setCanvasW(DEFAULT_CANVAS.width)
      setCanvasH(DEFAULT_CANVAS.height)
      setFields({ ...DEFAULT_FIELDS })
      setSelectedKey(null)
      return
    }

    setCanvasW(lj.canvas?.width ?? DEFAULT_CANVAS.width)
    setCanvasH(lj.canvas?.height ?? DEFAULT_CANVAS.height)
    setFields(lj.fields ?? {})
    setSelectedKey(null)
  }, [certQ.data])

  const templateUrl = certQ.data?.template_url ?? null
  const [bgImg, bgStatus] = useImage(templateUrl ?? "", "anonymous")

  const saveM = useMutation({
    mutationFn: () =>
      certificateService.saveLayout(id as string, {
        canvas: { width: canvasW, height: canvasH },
        fields,
      }),
    onSuccess: (res) => {
      const lj = res.data.layout_json
      if (lj) {
        setCanvasW(lj.canvas.width)
        setCanvasH(lj.canvas.height)
        setFields(lj.fields)
      }
      setSelectedKey(null)
    },
  })

  const activateM = useMutation({
    mutationFn: () => certificateService.activate(id as string, true),
    onSuccess: async () => {
      await certQ.refetch()
    },
  })

  const busy = certQ.isFetching || saveM.isPending || activateM.isPending
  const cert = certQ.data

  const selected = React.useMemo(() => {
    if (!selectedKey) return null
    return fields[selectedKey] ? { key: selectedKey, ...fields[selectedKey] } : null
  }, [fields, selectedKey])

  function upsertField(key: string, val: { x: number; y: number; fontSize: number; align: CertificateTextAlign }) {
    setFields((prev) => ({ ...prev, [key]: val }))
  }

  function removeSelected() {
    if (!selectedKey) return
    setFields((prev) => {
      const next = { ...prev }
      delete next[selectedKey]
      return next
    })
    setSelectedKey(null)
  }

  function addField(key: string) {
    const k = key.trim()
    if (!k) return
    if (fields[k]) {
      setSelectedKey(k)
      return
    }
    upsertField(k, { x: 300, y: 300, fontSize: 48, align: "left" })
    setSelectedKey(k)
  }

  // scale preview (fit width)
  const previewMaxW = 900
  const previewScale = React.useMemo(() => {
    const s = previewMaxW / Math.max(1, canvasW)
    return Math.min(1, s)
  }, [canvasW])

  return (
    <PageHeaderLayout
      title={cert ? `Layout Certificate — ${cert.name}` : "Layout Certificate"}
      description="Drag teks untuk mengatur posisi. Klik Simpan untuk menyimpan layout_json."
      showBack={false}
    >
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/certificates")}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>

          <div className="flex flex-wrap gap-2">
            {cert ? (
              <Badge variant={cert.is_active ? "success" : "muted"}>
                {cert.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            ) : null}

            <Button
              variant="outline"
              disabled={busy || !id}
              onClick={() => activateM.mutate()}
              title="Aktifkan sertifikat ini (backend menonaktifkan yang lain)"
            >
              <Power className="h-4 w-4" />
              Aktifkan
            </Button>

            <Button disabled={busy || !id} onClick={() => saveM.mutate()}>
              <Save className="h-4 w-4" />
              Simpan Layout
            </Button>
          </div>
        </div>

        {certQ.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {getApiErrorMessage(certQ.error)}
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          {/* Canvas */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium">Canvas</div>
                <div className="text-xs text-muted-foreground">
                  {canvasW} × {canvasH} px • scale {previewScale.toFixed(2)}
                </div>

                <div className="text-[11px] text-muted-foreground break-all mt-1">
                  BG: {templateUrl ? `${bgStatus} • ${templateUrl}` : "(template_url kosong)"}
                </div>
              </div>

              {busy ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses…
                </div>
              ) : null}
            </div>

            <Separator />

            <div className="p-4 overflow-auto">
              <Stage
                width={Math.round(canvasW * previewScale)}
                height={Math.round(canvasH * previewScale)}
                onMouseDown={(e) => {
                  if (e.target === e.target.getStage()) setSelectedKey(null)
                }}
                className="rounded-lg border bg-white"
              >
                <Layer>
                  {/* base bg */}
                  <Rect
                    x={0}
                    y={0}
                    width={canvasW * previewScale}
                    height={canvasH * previewScale}
                    fill="#ffffff"
                    stroke="#e2e8f0"
                    strokeWidth={2}
                  />

                  {bgImg ? (
                    <KonvaImage
                      image={bgImg}
                      x={0}
                      y={0}
                      width={canvasW * previewScale}
                      height={canvasH * previewScale}
                      listening={false}
                    />
                  ) : null}

                  {Object.entries(fields).map(([key, fp]) => {
                    const isSel = key === selectedKey
                    const x = fp.x * previewScale
                    const y = fp.y * previewScale

                    const text = previewText(key)
                    const fontSize = Math.max(10, fp.fontSize * previewScale)
                    const align = fp.align ?? "left"
                    const w = estimateTextBoxWidth(text, fontSize)

                    return (
                      <Group
                        key={key}
                        x={x}
                        y={y}
                        draggable
                        onClick={() => setSelectedKey(key)}
                        onTap={() => setSelectedKey(key)}
                        onDragEnd={(ev) => {
                          const nx = ev.target.x() / previewScale
                          const ny = ev.target.y() / previewScale
                          upsertField(key, {
                            ...fp,
                            x: Math.round(nx),
                            y: Math.round(ny),
                          })
                        }}
                      >
                        {isSel ? (
                          <Rect
                            x={-8}
                            y={-8}
                            width={w + 16}
                            height={fontSize + 16}
                            stroke="#2563eb"
                            strokeWidth={2}
                            dash={[6, 4]}
                          />
                        ) : null}

                        <KonvaText
                          text={text}
                          fontSize={fontSize}
                          width={w}
                          align={align}
                          fill={isSel ? "#1d4ed8" : "#0f172a"}
                        />
                      </Group>
                    )
                  })}
                </Layer>
              </Stage>
            </div>
          </div>

          {/* Inspector */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="p-4 space-y-3">
              <div>
                <div className="font-medium">Properti</div>
                <div className="text-xs text-muted-foreground">Klik item di canvas untuk edit.</div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Canvas W</div>
                  <Input value={String(canvasW)} onChange={(e) => setCanvasW(Number(e.target.value || 0))} disabled={busy} />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Canvas H</div>
                  <Input value={String(canvasH)} onChange={(e) => setCanvasH(Number(e.target.value || 0))} disabled={busy} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Tambah Field</div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={() => addField("participant_name")}>
                    <Plus className="h-4 w-4" />
                    Nama
                  </Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => addField("certificate_no")}>
                    <Plus className="h-4 w-4" />
                    No Sertifikat
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={() => addField("exam_date")}>
                    <Plus className="h-4 w-4" />
                    Tgl Ujian
                  </Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => addField("score_total")}>
                    <Plus className="h-4 w-4" />
                    Nilai Total
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Bebas tambah key apapun: score_verbal, score_kuantitatif, score_logika, score_spasial, dll.
                </div>
              </div>

              <Separator />

              {selected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{selected.key}</div>
                    <Button variant="outline" size="sm" onClick={removeSelected} disabled={busy}>
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">X</div>
                      <Input
                        value={String(selected.x)}
                        onChange={(e) =>
                          upsertField(selected.key, {
                            x: Number(e.target.value || 0),
                            y: selected.y,
                            fontSize: selected.fontSize,
                            align: selected.align,
                          })
                        }
                        disabled={busy}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Y</div>
                      <Input
                        value={String(selected.y)}
                        onChange={(e) =>
                          upsertField(selected.key, {
                            x: selected.x,
                            y: Number(e.target.value || 0),
                            fontSize: selected.fontSize,
                            align: selected.align,
                          })
                        }
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Font Size</div>
                    <Input
                      value={String(selected.fontSize)}
                      onChange={(e) =>
                        upsertField(selected.key, {
                          x: selected.x,
                          y: selected.y,
                          fontSize: Number(e.target.value || 0),
                          align: selected.align,
                        })
                      }
                      disabled={busy}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Align</div>
                    <Input
                      value={String(selected.align ?? "left")}
                      onChange={(e) =>
                        upsertField(selected.key, {
                          x: selected.x,
                          y: selected.y,
                          fontSize: selected.fontSize,
                          align: parseAlign(e.target.value),
                        })
                      }
                      disabled={busy}
                      placeholder="left / center / right"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Belum ada yang dipilih.</div>
              )}
            </div>
          </div>
        </div>

        {saveM.isError || activateM.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {getApiErrorMessage(saveM.error ?? activateM.error)}
          </div>
        ) : null}
      </div>
    </PageHeaderLayout>
  )
}
