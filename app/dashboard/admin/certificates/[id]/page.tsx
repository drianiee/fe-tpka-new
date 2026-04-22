"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Stage,
  Layer,
  Rect,
  Text as KonvaText,
  Group,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import { ArrowLeft, Save, Power, Plus, Trash2, Loader2 } from "lucide-react";

import { certificateService } from "@/lib/services/certificate.service";
import type {
  Certificate,
  CertificateLayoutJson,
  CertificateFieldPlacement,
  CertificateFieldPlacementText,
  CertificateFieldPlacementQr,
} from "@/lib/types/certificate";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const DEFAULT_CANVAS = { width: 2000, height: 1414 };
const FONT_FAMILY = "Arial";

type ApiTextField = {
  x: number;
  y: number;
  fontSize: number;
  align?: string;
};

type ApiQrField = {
  x: number;
  y: number;
  size: number;
};

type ApiFieldValue = ApiTextField | ApiQrField;
type ApiFieldsRecord = Record<string, ApiFieldValue>;

const DEFAULT_FIELDS: CertificateLayoutJson["fields"] = {
  participant_name: {
    type: "text",
    x: 1000,
    y: 600,
    fontSize: 72,
    align: "left",
  },
  certificate_no: {
    type: "text",
    x: 220,
    y: 220,
    fontSize: 28,
    align: "left",
  },
  exam_date: {
    type: "text",
    x: 1000,
    y: 720,
    fontSize: 34,
    align: "left",
  },
  score_verbal: {
    type: "text",
    x: 1600,
    y: 300,
    fontSize: 30,
    align: "left",
  },
  score_kuantitatif: {
    type: "text",
    x: 1600,
    y: 360,
    fontSize: 30,
    align: "left",
  },
  score_logika: {
    type: "text",
    x: 1600,
    y: 420,
    fontSize: 30,
    align: "left",
  },
  score_spasial: {
    type: "text",
    x: 1600,
    y: 480,
    fontSize: 30,
    align: "left",
  },
  score_total: {
    type: "text",
    x: 1600,
    y: 540,
    fontSize: 34,
    align: "left",
  },
  qr_code: {
    type: "qr",
    x: 1700,
    y: 1100,
    size: 220,
  },
};

function previewText(key: string) {
  switch (key) {
    case "participant_name":
      return "Nama Peserta";
    case "certificate_no":
      return "001/TPKA/I/2026/1/2026";
    case "exam_date":
      return "22 april 2026";
    case "score_verbal":
      return "80";
    case "score_kuantitatif":
      return "75";
    case "score_logika":
      return "78";
    case "score_spasial":
      return "74";
    case "score_total":
      return "77";
    default:
      return key;
  }
}

function measureTextWidth(text: string, fontSize: number, fontFamily = FONT_FAMILY) {
  if (typeof document === "undefined") {
    return Math.max(160, text.length * fontSize * 0.6);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Math.max(160, text.length * fontSize * 0.6);
  }

  ctx.font = `${fontSize}px "${fontFamily}"`;
  const metrics = ctx.measureText(text);
  return Math.max(160, Math.ceil(metrics.width));
}

function isTextField(
  v: CertificateFieldPlacement
): v is CertificateFieldPlacementText {
  return v.type === "text";
}

function isQrField(
  v: CertificateFieldPlacement
): v is CertificateFieldPlacementQr {
  return v.type === "qr";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiQrField(v: unknown): v is ApiQrField {
  if (!isRecord(v)) return false;
  return (
    typeof v.x === "number" &&
    typeof v.y === "number" &&
    typeof v.size === "number"
  );
}

function isApiTextField(v: unknown): v is ApiTextField {
  if (!isRecord(v)) return false;
  return (
    typeof v.x === "number" &&
    typeof v.y === "number" &&
    typeof v.fontSize === "number"
  );
}

function isApiFieldsRecord(v: unknown): v is ApiFieldsRecord {
  if (!isRecord(v)) return false;
  for (const val of Object.values(v)) {
    if (!isApiQrField(val) && !isApiTextField(val)) return false;
  }
  return true;
}

function normalizeFieldsFromApi(
  fields: unknown
): CertificateLayoutJson["fields"] {
  const out: CertificateLayoutJson["fields"] = {};
  if (!isApiFieldsRecord(fields)) return out;

  for (const [k, v] of Object.entries(fields)) {
    if (isApiQrField(v)) {
      out[k] = { type: "qr", x: v.x, y: v.y, size: v.size };
      continue;
    }

    if (isApiTextField(v)) {
      out[k] = {
        type: "text",
        x: v.x,
        y: v.y,
        fontSize: v.fontSize,
        align: "left",
      };
    }
  }

  return out;
}

function toApiFieldsPayload(
  fields: CertificateLayoutJson["fields"]
): ApiFieldsRecord {
  const out: ApiFieldsRecord = {};

  for (const [k, v] of Object.entries(fields)) {
    if (isQrField(v)) {
      out[k] = { x: v.x, y: v.y, size: v.size };
    } else {
      out[k] = { x: v.x, y: v.y, fontSize: v.fontSize, align: "left" };
    }
  }

  return out;
}

export default function AdminCertificateLayoutPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const certQ = useQuery({
    queryKey: [API_ENDPOINTS.ADMIN.CERTIFICATES.DETAIL(id ?? ""), id],
    queryFn: () => certificateService.get(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const [canvasW, setCanvasW] = React.useState(DEFAULT_CANVAS.width);
  const [canvasH, setCanvasH] = React.useState(DEFAULT_CANVAS.height);
  const [fields, setFields] = React.useState<CertificateLayoutJson["fields"]>({
    ...DEFAULT_FIELDS,
  });
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [availableWidth, setAvailableWidth] = React.useState(900);

  React.useEffect(() => {
    const cert: Certificate | undefined = certQ.data;
    if (!cert) return;

    const lj = cert.layout_json;
    if (!lj) {
      setCanvasW(DEFAULT_CANVAS.width);
      setCanvasH(DEFAULT_CANVAS.height);
      setFields({ ...DEFAULT_FIELDS });
      setSelectedKey(null);
      return;
    }

    setCanvasW(lj.canvas?.width ?? DEFAULT_CANVAS.width);
    setCanvasH(lj.canvas?.height ?? DEFAULT_CANVAS.height);

    const rawFields = (lj as unknown as { fields?: unknown }).fields;
    const normalized = normalizeFieldsFromApi(rawFields);

    setFields(
      Object.keys(normalized).length > 0 ? normalized : { ...DEFAULT_FIELDS }
    );

    setSelectedKey(null);
  }, [certQ.data]);

  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      setAvailableWidth(el.clientWidth - 32);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const templateUrl = certQ.data?.template_url ?? null;
  const [bgImg] = useImage(templateUrl ?? "", "anonymous");

  function upsertField(key: string, val: CertificateFieldPlacement) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  function removeSelected() {
    if (!selectedKey) return;
    setFields((prev) => {
      const next = { ...prev };
      delete next[selectedKey];
      return next;
    });
    setSelectedKey(null);
  }

  function addTextField(key: string) {
    const k = key.trim();
    if (!k) return;

    if (fields[k]) {
      setSelectedKey(k);
      return;
    }

    upsertField(k, {
      type: "text",
      x: 300,
      y: 300,
      fontSize: 48,
      align: "left",
    });

    setSelectedKey(k);
  }

  function addQrField() {
    const k = "qr_code";
    if (fields[k]) {
      setSelectedKey(k);
      return;
    }

    upsertField(k, {
      type: "qr",
      x: 1700,
      y: 1100,
      size: 220,
    });

    setSelectedKey(k);
  }

  const saveM = useMutation({
    mutationFn: () => {
      const payload: {
        canvas: { width: number; height: number };
        fields: ApiFieldsRecord;
      } = {
        canvas: { width: canvasW, height: canvasH },
        fields: toApiFieldsPayload(fields),
      };

      return certificateService.saveLayout(
        id as string,
        payload as unknown as CertificateLayoutJson
      );
    },
    onSuccess: (res) => {
      const lj = res.data.layout_json;
      if (lj) {
        setCanvasW(lj.canvas.width);
        setCanvasH(lj.canvas.height);
        const rawFields = (lj as unknown as { fields?: unknown }).fields;
        setFields(normalizeFieldsFromApi(rawFields));
      }
      setSelectedKey(null);
    },
  });

  const activateM = useMutation({
    mutationFn: () => certificateService.activate(id as string, true),
    onSuccess: async () => {
      await certQ.refetch();
    },
  });

  const busy = certQ.isFetching || saveM.isPending || activateM.isPending;
  const cert = certQ.data;

  const selected = React.useMemo(() => {
    if (!selectedKey) return null;
    const v = fields[selectedKey];
    if (!v) return null;
    return { key: selectedKey, val: v };
  }, [fields, selectedKey]);

  const previewScale = React.useMemo(() => {
    const s = availableWidth / Math.max(1, canvasW);
    return Math.min(1, s);
  }, [availableWidth, canvasW]);

  const stageW = Math.round(canvasW * previewScale);
  const stageH = Math.round(canvasH * previewScale);

  return (
    <PageHeaderLayout
      title={cert ? `Layout Certificate — ${cert.name}` : "Layout Certificate"}
      description="Drag teks/QR untuk mengatur posisi. Klik Simpan untuk menyimpan layout_json."
      showBack={false}
    >
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/certificates")}
          >
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
              title="Aktifkan sertifikat ini"
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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
          <div ref={wrapperRef} className="overflow-hidden rounded-xl border bg-white">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="text-sm">
                <div className="font-medium">Canvas</div>
                <div className="text-xs text-muted-foreground">
                  {canvasW} × {canvasH} px • scale {previewScale.toFixed(2)}
                </div>
                {/* {templateUrl ? (
                  <div className="text-xs text-muted-foreground break-all">
                    BG: loaded • {templateUrl}
                  </div>
                ) : null} */}
              </div>

              {busy ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses…
                </div>
              ) : null}
            </div>

            <Separator />

            <div className="p-4">
              <div className="flex justify-center overflow-hidden">
                <Stage
                  width={stageW}
                  height={stageH}
                  onMouseDown={(e) => {
                    if (e.target === e.target.getStage()) setSelectedKey(null);
                  }}
                  className="rounded-lg border bg-white"
                >
                  <Layer>
                    <Rect
                      x={0}
                      y={0}
                      width={stageW}
                      height={stageH}
                      fill="#ffffff"
                      stroke="#e2e8f0"
                      strokeWidth={2}
                    />

                    {bgImg ? (
                      <KonvaImage
                        image={bgImg}
                        x={0}
                        y={0}
                        width={stageW}
                        height={stageH}
                        listening={false}
                      />
                    ) : null}

                    {Object.entries(fields).map(([key, fp]) => {
                      const isSel = key === selectedKey;

                      if (isQrField(fp)) {
                        const x = fp.x * previewScale;
                        const y = fp.y * previewScale;
                        const size = Math.max(16, fp.size * previewScale);

                        return (
                          <Group
                            key={key}
                            x={x}
                            y={y}
                            draggable
                            onClick={() => setSelectedKey(key)}
                            onTap={() => setSelectedKey(key)}
                            onDragEnd={(ev) => {
                              const nx = ev.target.x() / previewScale;
                              const ny = ev.target.y() / previewScale;

                              upsertField(key, {
                                type: "qr",
                                x: Math.round(nx),
                                y: Math.round(ny),
                                size: fp.size,
                              });
                            }}
                          >
                            {isSel ? (
                              <Rect
                                x={-8}
                                y={-8}
                                width={size + 16}
                                height={size + 16}
                                stroke="#2563eb"
                                strokeWidth={2}
                                dash={[6, 4]}
                              />
                            ) : null}

                            <Rect
                              x={0}
                              y={0}
                              width={size}
                              height={size}
                              stroke="#0f172a"
                              strokeWidth={2}
                            />

                            <KonvaText
                              text="QR"
                              x={0}
                              y={Math.max(0, size / 2 - 14)}
                              width={size}
                              align="center"
                              fontSize={Math.max(12, size * 0.18)}
                              fontFamily={FONT_FAMILY}
                              fill={isSel ? "#1d4ed8" : "#0f172a"}
                            />
                          </Group>
                        );
                      }

                      const text = previewText(key);
                      const fontSize = Math.max(10, fp.fontSize * previewScale);
                      const textW = measureTextWidth(text, fontSize, FONT_FAMILY);

                      const x = fp.x * previewScale;
                      const y = fp.y * previewScale;

                      return (
                        <Group
                          key={key}
                          x={x}
                          y={y}
                          draggable
                          onClick={() => setSelectedKey(key)}
                          onTap={() => setSelectedKey(key)}
                          onDragEnd={(ev) => {
                            const nx = ev.target.x() / previewScale;
                            const ny = ev.target.y() / previewScale;

                            upsertField(key, {
                              type: "text",
                              x: Math.round(nx),
                              y: Math.round(ny),
                              fontSize: fp.fontSize,
                              align: "left",
                            });
                          }}
                        >
                          {isSel ? (
                            <Rect
                              x={-8}
                              y={-8}
                              width={textW + 16}
                              height={fontSize + 16}
                              stroke="#2563eb"
                              strokeWidth={2}
                              dash={[6, 4]}
                            />
                          ) : null}

                          <KonvaText
                            text={text}
                            x={0}
                            y={0}
                            fontSize={fontSize}
                            fontFamily={FONT_FAMILY}
                            fill={isSel ? "#1d4ed8" : "#0f172a"}
                          />
                        </Group>
                      );
                    })}
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="space-y-3 p-4">
              <div>
                <div className="font-medium">Properti</div>
                <div className="text-xs text-muted-foreground">
                  Klik item di canvas untuk edit.
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Canvas W</div>
                  <Input
                    value={String(canvasW)}
                    onChange={(e) => setCanvasW(Number(e.target.value || 0))}
                    disabled={busy}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Canvas H</div>
                  <Input
                    value={String(canvasH)}
                    onChange={(e) => setCanvasH(Number(e.target.value || 0))}
                    disabled={busy}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Tambah Field</div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("participant_name")}
                  >
                    <Plus className="h-4 w-4" />
                    Nama
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("certificate_no")}
                  >
                    <Plus className="h-4 w-4" />
                    No Sertifikat
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("exam_date")}
                  >
                    <Plus className="h-4 w-4" />
                    Tgl Ujian
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("score_verbal")}
                  >
                    <Plus className="h-4 w-4" />
                    Verbal
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("score_kuantitatif")}
                  >
                    <Plus className="h-4 w-4" />
                    Kuantitatif
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("score_logika")}
                  >
                    <Plus className="h-4 w-4" />
                    Logika
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("score_spasial")}
                  >
                    <Plus className="h-4 w-4" />
                    Spasial
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("score_total")}
                  >
                    <Plus className="h-4 w-4" />
                    Nilai Total
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={addQrField}
                  >
                    <Plus className="h-4 w-4" />
                    QR Verify
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Semua field teks otomatis left. QR pakai key{" "}
                  <span className="font-medium text-foreground">qr_code</span>.
                </div>
              </div>

              <Separator />

              {selected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="truncate font-medium">{selected.key}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeSelected}
                      disabled={busy}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">X</div>
                      <Input
                        value={String(selected.val.x)}
                        onChange={(e) => {
                          const x = Number(e.target.value || 0);
                          const v = selected.val;

                          if (isTextField(v)) {
                            upsertField(selected.key, {
                              type: "text",
                              x,
                              y: v.y,
                              fontSize: v.fontSize,
                              align: "left",
                            });
                          } else {
                            upsertField(selected.key, {
                              type: "qr",
                              x,
                              y: v.y,
                              size: v.size,
                            });
                          }
                        }}
                        disabled={busy}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Y</div>
                      <Input
                        value={String(selected.val.y)}
                        onChange={(e) => {
                          const y = Number(e.target.value || 0);
                          const v = selected.val;

                          if (isTextField(v)) {
                            upsertField(selected.key, {
                              type: "text",
                              x: v.x,
                              y,
                              fontSize: v.fontSize,
                              align: "left",
                            });
                          } else {
                            upsertField(selected.key, {
                              type: "qr",
                              x: v.x,
                              y,
                              size: v.size,
                            });
                          }
                        }}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  {isTextField(selected.val) ? (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Font Size
                      </div>
                      <Input
                        value={String(selected.val.fontSize)}
                        onChange={(e) => {
                          const fontSize = Number(e.target.value || 0);
                          const v = selected.val;
                          if (!isTextField(v)) return;

                          upsertField(selected.key, {
                            type: "text",
                            x: v.x,
                            y: v.y,
                            fontSize,
                            align: "left",
                          });
                        }}
                        disabled={busy}
                      />
                    </div>
                  ) : null}

                  {isQrField(selected.val) ? (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Size</div>
                      <Input
                        value={String(selected.val.size)}
                        onChange={(e) => {
                          const size = Number(e.target.value || 0);
                          const v = selected.val;
                          if (!isQrField(v)) return;

                          upsertField(selected.key, {
                            type: "qr",
                            x: v.x,
                            y: v.y,
                            size,
                          });
                        }}
                        disabled={busy}
                        placeholder="220"
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Belum ada yang dipilih.
                </div>
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
  );
}