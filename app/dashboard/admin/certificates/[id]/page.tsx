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
  Transformer,
} from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { ArrowLeft, Save, Power, Plus, Trash2, Loader2 } from "lucide-react";

import { certificateService } from "@/lib/services/certificate.service";
import type {
  Certificate,
  CertificateFontWeight,
  CertificateLayoutJson,
  CertificateFieldPlacement,
  CertificateFieldPlacementText,
  CertificateFieldPlacementQr,
  CertificateFieldPlacementImage,
} from "@/lib/types/certificate";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const DEFAULT_CANVAS = { width: 2000, height: 1414 };
const FONT_FAMILY = "Inter";
const DEFAULT_FONT_WEIGHT: CertificateFontWeight = "normal";
const FONT_FAMILY_OPTIONS = ["Inter", "Arial", "Helvetica", "DejaVu Sans"] as const;
const FONT_WEIGHT_OPTIONS: Array<{ label: string; value: CertificateFontWeight; previewClass: string }> = [
  { label: "Normal", value: "normal", previewClass: "font-normal" },
  { label: "Medium", value: "medium", previewClass: "font-medium" },
  { label: "Semi Bold", value: "semibold", previewClass: "font-semibold" },
  { label: "Bold", value: "bold", previewClass: "font-bold" },
];
const SAMPLE_QR_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" shape-rendering="crispEdges">
      <rect width="120" height="120" fill="white"/>
      <rect x="8" y="8" width="32" height="32" fill="black"/>
      <rect x="14" y="14" width="20" height="20" fill="white"/>
      <rect x="20" y="20" width="8" height="8" fill="black"/>
      <rect x="80" y="8" width="32" height="32" fill="black"/>
      <rect x="86" y="14" width="20" height="20" fill="white"/>
      <rect x="92" y="20" width="8" height="8" fill="black"/>
      <rect x="8" y="80" width="32" height="32" fill="black"/>
      <rect x="14" y="86" width="20" height="20" fill="white"/>
      <rect x="20" y="92" width="8" height="8" fill="black"/>
      <rect x="50" y="10" width="8" height="8" fill="black"/>
      <rect x="62" y="10" width="8" height="8" fill="black"/>
      <rect x="50" y="22" width="8" height="8" fill="black"/>
      <rect x="62" y="22" width="8" height="8" fill="black"/>
      <rect x="44" y="44" width="8" height="8" fill="black"/>
      <rect x="56" y="44" width="8" height="8" fill="black"/>
      <rect x="68" y="44" width="8" height="8" fill="black"/>
      <rect x="80" y="44" width="8" height="8" fill="black"/>
      <rect x="44" y="56" width="8" height="8" fill="black"/>
      <rect x="68" y="56" width="8" height="8" fill="black"/>
      <rect x="92" y="56" width="8" height="8" fill="black"/>
      <rect x="44" y="68" width="8" height="8" fill="black"/>
      <rect x="56" y="68" width="8" height="8" fill="black"/>
      <rect x="80" y="68" width="8" height="8" fill="black"/>
      <rect x="92" y="68" width="8" height="8" fill="black"/>
      <rect x="50" y="80" width="8" height="8" fill="black"/>
      <rect x="62" y="80" width="8" height="8" fill="black"/>
      <rect x="74" y="80" width="8" height="8" fill="black"/>
      <rect x="86" y="80" width="8" height="8" fill="black"/>
      <rect x="50" y="92" width="8" height="8" fill="black"/>
      <rect x="74" y="92" width="8" height="8" fill="black"/>
      <rect x="98" y="92" width="8" height="8" fill="black"/>
    </svg>
  `);
const DEFAULT_IMAGE_FIELD_SIZES = {
  sign_image: { width: 260, height: 120 },
  stamp_image: { width: 180, height: 180 },
} as const;

type ApiTextField = {
  x: number;
  y: number;
  fontSize: number;
  align?: string;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  width?: number;
};

type ApiQrField = {
  x: number;
  y: number;
  size: number;
};

type ApiImageField = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TransformerAnchor = NonNullable<
  React.ComponentProps<typeof Transformer>["enabledAnchors"]
>[number];
type CanvasNode = Konva.Group | Konva.Text | Konva.Image;

type ApiFieldValue = ApiTextField | ApiQrField | ApiImageField;
type ApiFieldsRecord = Record<string, ApiFieldValue>;

const DEFAULT_FIELDS: CertificateLayoutJson["fields"] = {
  participant_name: {
    type: "text",
    x: 1000,
    y: 600,
    fontSize: 72,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  certificate_no: {
    type: "text",
    x: 220,
    y: 220,
    fontSize: 28,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  exam_date: {
    type: "text",
    x: 1000,
    y: 720,
    fontSize: 34,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  score_verbal: {
    type: "text",
    x: 1600,
    y: 300,
    fontSize: 30,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  score_kuantitatif: {
    type: "text",
    x: 1600,
    y: 360,
    fontSize: 30,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  score_logika: {
    type: "text",
    x: 1600,
    y: 420,
    fontSize: 30,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  score_spasial: {
    type: "text",
    x: 1600,
    y: 480,
    fontSize: 30,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  score_total: {
    type: "text",
    x: 1600,
    y: 540,
    fontSize: 34,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  sign_name: {
    type: "text",
    x: 1350,
    y: 1080,
    fontSize: 34,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  sign_nip: {
    type: "text",
    x: 1350,
    y: 1130,
    fontSize: 28,
    align: "left",
    color: "#0f172a",
    fontFamily: FONT_FAMILY,
    fontWeight: DEFAULT_FONT_WEIGHT,
  },
  sign_image: {
    type: "image",
    x: 1350,
    y: 950,
    width: 260,
    height: 120,
  },
  stamp_image: {
    type: "image",
    x: 1600,
    y: 980,
    width: 180,
    height: 180,
  },
  qr_code: {
    type: "qr",
    x: 1700,
    y: 1100,
    size: 220,
  },
};

// Jangan diletakkan di bawah /api: di server produksi seluruh /api diarahkan ke
// Laravel oleh reverse proxy, sehingga route handler Next.js tidak akan pernah terpanggil.
function proxiedAssetUrl(src?: string | null) {
  return src ? `/certificate-assets?src=${encodeURIComponent(src)}` : null;
}

function previewText(key: string, cert?: Certificate | null) {
  switch (key) {
    case "participant_name":
      return "Nama Peserta";
    case "certificate_no":
      return cert?.letter_prefix ? `${cert.letter_prefix}/${cert.year}/1` : "TPKA/2026/1";
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
    case "sign_name":
      return cert?.sign_name || "Nama Penandatangan";
    case "sign_nip":
      return cert?.sign_nip ? `NIP ${cert.sign_nip}` : "NIP 123456789";
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

function estimateTextBoxHeight(
  text: string,
  fontSize: number,
  width: number,
  fontFamily = FONT_FAMILY
) {
  const measured = measureTextWidth(text, fontSize, fontFamily);
  const lines = Math.max(1, Math.ceil(measured / Math.max(40, width)));
  return Math.max(fontSize * 1.25, lines * fontSize * 1.25);
}

function normalizeFontWeight(value: unknown): CertificateFontWeight {
  return value === "medium" || value === "semibold" || value === "bold"
    ? value
    : "normal";
}

function konvaFontStyle(weight?: CertificateFontWeight): "normal" | "bold" {
  return weight === "bold" || weight === "semibold" ? "bold" : "normal";
}

function scaleFieldsToCanvas(
  source: CertificateLayoutJson["fields"],
  fromCanvas: { width: number; height: number },
  toCanvas: { width: number; height: number }
): CertificateLayoutJson["fields"] {
  const scaleX = toCanvas.width / Math.max(1, fromCanvas.width);
  const scaleY = toCanvas.height / Math.max(1, fromCanvas.height);
  const scaleText = Math.min(scaleX, scaleY);

  return Object.fromEntries(
    Object.entries(source).map(([key, field]) => {
      if (isQrField(field)) {
        return [
          key,
          {
            ...field,
            x: Math.round(field.x * scaleX),
            y: Math.round(field.y * scaleY),
            size: Math.max(20, Math.round(field.size * scaleText)),
          } satisfies CertificateFieldPlacementQr,
        ];
      }

      if (isImageField(field)) {
        return [
          key,
          {
            ...field,
            x: Math.round(field.x * scaleX),
            y: Math.round(field.y * scaleY),
            width: Math.max(20, Math.round(field.width * scaleX)),
            height: Math.max(20, Math.round(field.height * scaleY)),
          } satisfies CertificateFieldPlacementImage,
        ];
      }

      return [
        key,
        {
          ...field,
          x: Math.round(field.x * scaleX),
          y: Math.round(field.y * scaleY),
          fontSize: Math.max(8, Math.round(field.fontSize * scaleText)),
          width:
            typeof field.width === "number"
              ? Math.max(40, Math.round(field.width * scaleX))
              : field.width,
        } satisfies CertificateFieldPlacementText,
      ];
    })
  );
}

function clampFieldsToCanvas(
  source: CertificateLayoutJson["fields"],
  canvas: { width: number; height: number }
): CertificateLayoutJson["fields"] {
  return Object.fromEntries(
    Object.entries(source).map(([key, field]) => {
      if (isQrField(field)) {
        const size = Math.max(20, Math.min(field.size, Math.min(canvas.width, canvas.height)));
        return [
          key,
          {
            ...field,
            size,
            x: Math.max(0, Math.min(field.x, canvas.width - size)),
            y: Math.max(0, Math.min(field.y, canvas.height - size)),
          } satisfies CertificateFieldPlacementQr,
        ];
      }

      if (isImageField(field)) {
        const width = Math.max(20, Math.min(field.width, canvas.width));
        const height = Math.max(20, Math.min(field.height, canvas.height));
        return [
          key,
          {
            ...field,
            width,
            height,
            x: Math.max(0, Math.min(field.x, canvas.width - width)),
            y: Math.max(0, Math.min(field.y, canvas.height - height)),
          } satisfies CertificateFieldPlacementImage,
        ];
      }

      const width = typeof field.width === "number"
        ? Math.max(40, Math.min(field.width, canvas.width))
        : field.width;

      return [
        key,
        {
          ...field,
          width,
          x: Math.max(0, Math.min(field.x, canvas.width - 40)),
          y: Math.max(0, Math.min(field.y, canvas.height - field.fontSize)),
        } satisfies CertificateFieldPlacementText,
      ];
    })
  );
}

function fitImageToFrame(
  frameWidth: number,
  frameHeight: number,
  imageWidth?: number,
  imageHeight?: number
) {
  const safeFrameWidth = Math.max(20, frameWidth);
  const safeFrameHeight = Math.max(20, frameHeight);
  const safeImageWidth = Math.max(1, imageWidth ?? safeFrameWidth);
  const safeImageHeight = Math.max(1, imageHeight ?? safeFrameHeight);
  const scale = Math.min(
    safeFrameWidth / safeImageWidth,
    safeFrameHeight / safeImageHeight
  );
  const width = Math.max(1, Math.round(safeImageWidth * scale));
  const height = Math.max(1, Math.round(safeImageHeight * scale));

  return {
    width,
    height,
    offsetX: Math.round((safeFrameWidth - width) / 2),
    offsetY: Math.round((safeFrameHeight - height) / 2),
  };
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

function isImageField(
  v: CertificateFieldPlacement
): v is CertificateFieldPlacementImage {
  return v.type === "image";
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

function isApiImageField(v: unknown): v is ApiImageField {
  if (!isRecord(v)) return false;
  return (
    typeof v.x === "number" &&
    typeof v.y === "number" &&
    typeof v.width === "number" &&
    typeof v.height === "number"
  );
}

function isApiFieldsRecord(v: unknown): v is ApiFieldsRecord {
  if (!isRecord(v)) return false;
  for (const val of Object.values(v)) {
    if (!isApiQrField(val) && !isApiTextField(val) && !isApiImageField(val)) return false;
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

    if (isApiImageField(v)) {
      out[k] = { type: "image", x: v.x, y: v.y, width: v.width, height: v.height };
      continue;
    }

    if (isApiTextField(v)) {
      out[k] = {
        type: "text",
        x: v.x,
        y: v.y,
        fontSize: v.fontSize,
        align: v.align === "center" || v.align === "right" ? v.align : "left",
        color: typeof v.color === "string" ? v.color : "#0f172a",
        fontFamily: typeof v.fontFamily === "string" ? v.fontFamily : FONT_FAMILY,
        fontWeight: normalizeFontWeight(v.fontWeight),
        width: typeof v.width === "number" ? v.width : undefined,
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
    } else if (isImageField(v)) {
      out[k] = { x: v.x, y: v.y, width: v.width, height: v.height };
    } else {
      out[k] = {
        x: v.x,
        y: v.y,
        fontSize: v.fontSize,
        align: v.align,
        color: v.color,
        fontFamily: v.fontFamily,
        fontWeight: v.fontWeight,
        width: v.width,
      };
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
  const transformerRef = React.useRef<Konva.Transformer | null>(null);
  const nodeRefs = React.useRef<Record<string, CanvasNode | null>>({});

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
      const nextCanvas = { width: DEFAULT_CANVAS.width, height: DEFAULT_CANVAS.height };
      setCanvasW(nextCanvas.width);
      setCanvasH(nextCanvas.height);
      setFields({ ...DEFAULT_FIELDS });
      setSelectedKey(null);
      return;
    }

    const nextCanvas = {
      width: lj.canvas?.width ?? DEFAULT_CANVAS.width,
      height: lj.canvas?.height ?? DEFAULT_CANVAS.height,
    };
    setCanvasW(nextCanvas.width);
    setCanvasH(nextCanvas.height);

    const rawFields = (lj as unknown as { fields?: unknown }).fields;
    const normalized = normalizeFieldsFromApi(rawFields);

    setFields(
      Object.keys(normalized).length > 0
        ? clampFieldsToCanvas(normalized, nextCanvas)
        : clampFieldsToCanvas({ ...DEFAULT_FIELDS }, nextCanvas)
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

  const templateUrl = proxiedAssetUrl(certQ.data?.template_url ?? null);
  const signUrl = proxiedAssetUrl(certQ.data?.sign_url ?? null);
  const stampUrl = proxiedAssetUrl(certQ.data?.stamp_url ?? null);
  const [bgImg] = useImage(templateUrl ?? "", "anonymous");
  const [signImg] = useImage(signUrl ?? "", "anonymous");
  const [stampImg] = useImage(stampUrl ?? "", "anonymous");
  const [sampleQrImg] = useImage(SAMPLE_QR_DATA_URI, "anonymous");

  React.useEffect(() => {
    if (!bgImg || certQ.data?.layout_json) return;
    const width = bgImg.naturalWidth || bgImg.width;
    const height = bgImg.naturalHeight || bgImg.height;
    if (width > 0 && height > 0) {
      setCanvasW(width);
      setCanvasH(height);
      setFields((prev) =>
        scaleFieldsToCanvas(
          prev,
          { width: DEFAULT_CANVAS.width, height: DEFAULT_CANVAS.height },
          { width, height }
        )
      );
    }
  }, [bgImg, certQ.data?.layout_json]);

  React.useEffect(() => {
    if (!selectedKey) {
      transformerRef.current?.nodes([]);
      transformerRef.current?.getLayer()?.batchDraw();
      return;
    }

    const field = fields[selectedKey];
    const node = nodeRefs.current[selectedKey];

    if (!field || !node) {
      transformerRef.current?.nodes([]);
      transformerRef.current?.getLayer()?.batchDraw();
      return;
    }

    transformerRef.current?.nodes([node]);
    transformerRef.current?.getLayer()?.batchDraw();
  }, [fields, selectedKey]);

  React.useEffect(() => {
    if (!signImg || certQ.data?.layout_json) return;

    setFields((prev) => {
      const current = prev.sign_image;
      if (!current || !isImageField(current)) return prev;

      const nextWidth = signImg.naturalWidth || signImg.width;
      const nextHeight = signImg.naturalHeight || signImg.height;
      const defaults = DEFAULT_IMAGE_FIELD_SIZES.sign_image;

      if (
        nextWidth <= 0 ||
        nextHeight <= 0 ||
        current.width !== defaults.width ||
        current.height !== defaults.height
      ) {
        return prev;
      }

      return {
        ...prev,
        sign_image: {
          ...current,
          width: nextWidth,
          height: nextHeight,
        },
      };
    });
  }, [signImg, certQ.data?.layout_json]);

  React.useEffect(() => {
    if (!stampImg || certQ.data?.layout_json) return;

    setFields((prev) => {
      const current = prev.stamp_image;
      if (!current || !isImageField(current)) return prev;

      const nextWidth = stampImg.naturalWidth || stampImg.width;
      const nextHeight = stampImg.naturalHeight || stampImg.height;
      const defaults = DEFAULT_IMAGE_FIELD_SIZES.stamp_image;

      if (
        nextWidth <= 0 ||
        nextHeight <= 0 ||
        current.width !== defaults.width ||
        current.height !== defaults.height
      ) {
        return prev;
      }

      return {
        ...prev,
        stamp_image: {
          ...current,
          width: nextWidth,
          height: nextHeight,
        },
      };
    });
  }, [stampImg, certQ.data?.layout_json]);

  function upsertField(key: string, val: CertificateFieldPlacement) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  function resizeCanvas(nextWidth: number, nextHeight: number) {
    const safeWidth = Math.max(1, nextWidth);
    const safeHeight = Math.max(1, nextHeight);

    setFields((prev) =>
      scaleFieldsToCanvas(
        prev,
        { width: canvasW, height: canvasH },
        { width: safeWidth, height: safeHeight }
      )
    );
    setCanvasW(safeWidth);
    setCanvasH(safeHeight);
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
      x: Math.round(canvasW * 0.15),
      y: Math.round(canvasH * 0.2),
      fontSize: Math.max(16, Math.round(Math.min(canvasW, canvasH) * 0.03)),
      align: "left",
      color: "#0f172a",
      fontFamily: FONT_FAMILY,
      fontWeight: DEFAULT_FONT_WEIGHT,
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
      x: Math.max(20, Math.round(canvasW * 0.82)),
      y: Math.max(20, Math.round(canvasH * 0.78)),
      size: Math.max(80, Math.round(Math.min(canvasW, canvasH) * 0.11)),
    });

    setSelectedKey(k);
  }

  function addImageField(key: "sign_image" | "stamp_image") {
    if (fields[key]) {
      setSelectedKey(key);
      return;
    }

    const image = key === "sign_image" ? signImg : stampImg;
    const fallback = DEFAULT_IMAGE_FIELD_SIZES[key];

    upsertField(key, {
      type: "image",
      x: key === "sign_image" ? Math.round(canvasW * 0.67) : Math.round(canvasW * 0.8),
      y: key === "sign_image" ? Math.round(canvasH * 0.67) : Math.round(canvasH * 0.69),
      width: image ? image.naturalWidth || image.width : fallback.width,
      height: image ? image.naturalHeight || image.height : fallback.height,
    });

    setSelectedKey(key);
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
        setFields(
          clampFieldsToCanvas(normalizeFieldsFromApi(rawFields), {
            width: lj.canvas.width,
            height: lj.canvas.height,
          })
        );
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

  // Dihitung di luar JSX karena penyempitan tipe lewat isTextField() hilang
  // begitu nilainya dipakai di dalam callback seperti .map().
  const selectedFontWeight: CertificateFontWeight =
    selected && isTextField(selected.val)
      ? (selected.val.fontWeight ?? DEFAULT_FONT_WEIGHT)
      : DEFAULT_FONT_WEIGHT;

  const previewScale = React.useMemo(() => {
    const s = availableWidth / Math.max(1, canvasW);
    return Math.min(1, s);
  }, [availableWidth, canvasW]);

  const stageW = Math.round(canvasW * previewScale);
  const stageH = Math.round(canvasH * previewScale);
  const transformerAnchors = React.useMemo(() => {
    const cornerAnchors: TransformerAnchor[] = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ];

    if (!selected) return cornerAnchors;
    if (isTextField(selected.val)) {
      return [
        "top-left",
        "top-center",
        "top-right",
        "middle-left",
        "middle-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ] satisfies TransformerAnchor[];
    }

    return cornerAnchors;
  }, [selected]);

  return (
    <PageHeaderLayout
      title={cert ? `Layout Certificate — ${cert.name}` : "Layout Certificate"}
      // description="Drag teks/QR untuk mengatur posisi. Klik Simpan untuk menyimpan layout_json."
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
                            ref={(node) => {
                              if (node) {
                                nodeRefs.current[key] = node;
                              } else {
                                delete nodeRefs.current[key];
                              }
                            }}
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
                            onTransformEnd={(ev) => {
                              const node = ev.target;
                              const scale = Math.max(node.scaleX(), node.scaleY());
                              const nx = node.x() / previewScale;
                              const ny = node.y() / previewScale;
                              const size = Math.max(20, Math.round(fp.size * scale));

                              node.scaleX(1);
                              node.scaleY(1);

                              upsertField(key, {
                                type: "qr",
                                x: Math.round(nx),
                                y: Math.round(ny),
                                size,
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

                            {sampleQrImg ? (
                              <KonvaImage
                                image={sampleQrImg}
                                x={0}
                                y={0}
                                width={size}
                                height={size}
                              />
                            ) : (
                              <>
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
                              </>
                            )}
                          </Group>
                        );
                      }

                      if (isImageField(fp)) {
                        const x = fp.x * previewScale;
                        const y = fp.y * previewScale;
                        const width = Math.max(16, fp.width * previewScale);
                        const height = Math.max(16, fp.height * previewScale);
                        const image = key === "sign_image" ? signImg : stampImg;
                        const label = key === "sign_image" ? "TTD" : "Stempel";
                        const fitted = fitImageToFrame(
                          width,
                          height,
                          image?.naturalWidth || image?.width,
                          image?.naturalHeight || image?.height
                        );

                        return (
                          <Group
                            key={key}
                            ref={(node) => {
                              if (node) {
                                nodeRefs.current[key] = node;
                              } else {
                                delete nodeRefs.current[key];
                              }
                            }}
                            x={x}
                            y={y}
                            draggable
                            onClick={() => setSelectedKey(key)}
                            onTap={() => setSelectedKey(key)}
                            onDragEnd={(ev) => {
                              const nx = ev.target.x() / previewScale;
                              const ny = ev.target.y() / previewScale;

                              upsertField(key, {
                                type: "image",
                                x: Math.round(nx),
                                y: Math.round(ny),
                                width: fp.width,
                                height: fp.height,
                              });
                            }}
                            onTransformEnd={(ev) => {
                              const node = ev.target;
                              const scaleX = node.scaleX();
                              const nx = node.x() / previewScale;
                              const ny = node.y() / previewScale;
                              const width = Math.max(
                                20,
                                Math.round(fp.width * scaleX)
                              );
                              const sourceWidth =
                                image?.naturalWidth || image?.width || fp.width;
                              const sourceHeight =
                                image?.naturalHeight || image?.height || fp.height;
                              const aspectRatio =
                                sourceWidth > 0 && sourceHeight > 0
                                  ? sourceHeight / sourceWidth
                                  : fp.height / Math.max(1, fp.width);
                              const height = Math.max(
                                20,
                                Math.round(width * aspectRatio)
                              );

                              node.scaleX(1);
                              node.scaleY(1);

                              upsertField(key, {
                                type: "image",
                                x: Math.round(nx),
                                y: Math.round(ny),
                                width,
                                height,
                              });
                            }}
                          >
                            {isSel ? (
                              <Rect
                                x={-8}
                                y={-8}
                                width={width + 16}
                                height={height + 16}
                                stroke="#2563eb"
                                strokeWidth={2}
                                dash={[6, 4]}
                              />
                            ) : null}

                            {image ? (
                              <KonvaImage
                                image={image}
                                x={fitted.offsetX}
                                y={fitted.offsetY}
                                width={fitted.width}
                                height={fitted.height}
                              />
                            ) : (
                              <Rect
                                x={0}
                                y={0}
                                width={width}
                                height={height}
                                stroke="#94a3b8"
                                dash={[6, 4]}
                              />
                            )}

                            {!image ? (
                              <KonvaText
                                text={label}
                                x={0}
                                y={Math.max(0, height / 2 - 12)}
                                width={width}
                                align="center"
                                fontSize={Math.max(12, Math.min(18, height * 0.22))}
                                fontFamily={FONT_FAMILY}
                                fill="#64748b"
                              />
                            ) : null}
                          </Group>
                        );
                      }

                      const text = previewText(key, certQ.data);
                      const fontSize = Math.max(10, fp.fontSize * previewScale);
                      const baseWidth = Math.max(
                        40,
                        fp.width ?? measureTextWidth(text, fp.fontSize, fp.fontFamily ?? FONT_FAMILY)
                      );
                      const textW = baseWidth * previewScale;
                      const textH =
                        estimateTextBoxHeight(
                          text,
                          fp.fontSize,
                          baseWidth,
                          fp.fontFamily ?? FONT_FAMILY
                        ) * previewScale;

                      const x = fp.x * previewScale;
                      const y = fp.y * previewScale;

                      return (
                        <Group
                          key={key}
                          ref={(node) => {
                            if (node) {
                              nodeRefs.current[key] = node;
                            } else {
                              delete nodeRefs.current[key];
                            }
                          }}
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
                              align: fp.align,
                              color: fp.color,
                              fontFamily: fp.fontFamily,
                              fontWeight: fp.fontWeight,
                              width: fp.width,
                            });
                          }}
                          onTransformEnd={(ev) => {
                            const node = ev.target;
                            const scaleX = node.scaleX();
                            const nx = node.x() / previewScale;
                            const ny = node.y() / previewScale;
                            const width = Math.max(40, Math.round(baseWidth * scaleX));

                            node.scaleX(1);
                            node.scaleY(1);

                            upsertField(key, {
                              type: "text",
                              x: Math.round(nx),
                              y: Math.round(ny),
                              fontSize: fp.fontSize,
                              align: fp.align,
                              color: fp.color,
                              fontFamily: fp.fontFamily,
                              fontWeight: fp.fontWeight,
                              width,
                            });
                          }}
                        >
                          {isSel ? (
                            <Rect
                              x={-8}
                              y={-8}
                              width={textW + 16}
                              height={textH + 16}
                              stroke="#2563eb"
                              strokeWidth={2}
                              dash={[6, 4]}
                            />
                          ) : null}

                          <KonvaText
                            text={text}
                            x={0}
                            y={0}
                            width={textW}
                            align={fp.align}
                            fontSize={fontSize}
                            fontFamily={fp.fontFamily ?? FONT_FAMILY}
                            fontStyle={konvaFontStyle(fp.fontWeight)}
                            fill={isSel ? "#1d4ed8" : fp.color ?? "#0f172a"}
                            wrap="word"
                          />
                        </Group>
                      );
                    })}

                    <Transformer
                      ref={transformerRef}
                      enabledAnchors={transformerAnchors}
                      keepRatio={
                        Boolean(selectedKey) &&
                        Boolean(selectedKey && isImageField(fields[selectedKey]))
                      }
                      rotateEnabled={false}
                      ignoreStroke
                      borderStroke="#2563eb"
                      anchorStroke="#2563eb"
                      anchorFill="#ffffff"
                      anchorSize={10}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) {
                          return oldBox;
                        }

                        return newBox;
                      }}
                    />
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
                    onChange={(e) =>
                      resizeCanvas(Number(e.target.value || 0), canvasH)
                    }
                    disabled={busy}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Canvas H</div>
                  <Input
                    value={String(canvasH)}
                    onChange={(e) =>
                      resizeCanvas(canvasW, Number(e.target.value || 0))
                    }
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
                    onClick={() => addTextField("sign_name")}
                  >
                    <Plus className="h-4 w-4" />
                    Nama TTD
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => addTextField("sign_nip")}
                  >
                    <Plus className="h-4 w-4" />
                    NIP TTD
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || !signUrl}
                    onClick={() => addImageField("sign_image")}
                    title={signUrl ? "Tambahkan gambar TTD" : "Template ini belum punya file TTD"}
                  >
                    <Plus className="h-4 w-4" />
                    Gambar TTD
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || !stampUrl}
                    onClick={() => addImageField("stamp_image")}
                    title={stampUrl ? "Tambahkan gambar stempel" : "Template ini belum punya file stempel"}
                  >
                    <Plus className="h-4 w-4" />
                    Stempel
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
                              align: v.align,
                              color: v.color,
                              fontFamily: v.fontFamily,
                              fontWeight: v.fontWeight,
                              width: v.width,
                            });
                          } else if (isImageField(v)) {
                            upsertField(selected.key, {
                              type: "image",
                              x,
                              y: v.y,
                              width: v.width,
                              height: v.height,
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
                              align: v.align,
                              color: v.color,
                              fontFamily: v.fontFamily,
                              fontWeight: v.fontWeight,
                              width: v.width,
                            });
                          } else if (isImageField(v)) {
                            upsertField(selected.key, {
                              type: "image",
                              x: v.x,
                              y,
                              width: v.width,
                              height: v.height,
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
                            align: v.align,
                            color: v.color,
                            fontFamily: v.fontFamily,
                            fontWeight: v.fontWeight,
                            width: v.width,
                          });
                        }}
                        disabled={busy}
                      />
                    </div>
                  ) : null}

                  {isTextField(selected.val) ? (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Lebar Box</div>
                      <Input
                        value={String(
                          selected.val.width ??
                            measureTextWidth(
                              previewText(selected.key, certQ.data),
                              selected.val.fontSize,
                              selected.val.fontFamily ?? FONT_FAMILY
                            )
                        )}
                        onChange={(e) => {
                          const width = Number(e.target.value || 0);
                          const v = selected.val;
                          if (!isTextField(v)) return;

                          upsertField(selected.key, {
                            type: "text",
                            x: v.x,
                            y: v.y,
                            fontSize: v.fontSize,
                            align: v.align,
                            color: v.color,
                            fontFamily: v.fontFamily,
                            fontWeight: v.fontWeight,
                            width: Math.max(40, width),
                          });
                        }}
                        disabled={busy}
                        placeholder="420"
                      />
                    </div>
                  ) : null}

                  {isTextField(selected.val) ? (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Align</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(["left", "center", "right"] as const).map((align) => (
                          <Button
                            key={align}
                            type="button"
                            variant={
                              isTextField(selected.val) && selected.val.align === align
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            disabled={busy}
                            onClick={() => {
                              const v = selected.val;
                              if (!isTextField(v)) return;

                              upsertField(selected.key, {
                                type: "text",
                                x: v.x,
                                y: v.y,
                                fontSize: v.fontSize,
                                align,
                                color: v.color,
                                fontFamily: v.fontFamily,
                                fontWeight: v.fontWeight,
                                width: v.width,
                              });
                            }}
                          >
                            {align === "left" ? "Left" : align === "center" ? "Center" : "Right"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {isTextField(selected.val) ? (
                    <div className="grid grid-cols-[72px_1fr] items-end gap-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Warna
                        </div>
                        <Input
                          type="color"
                          value={selected.val.color ?? "#0f172a"}
                          onChange={(e) => {
                            const v = selected.val;
                            if (!isTextField(v)) return;

                            upsertField(selected.key, {
                              ...v,
                              color: e.target.value,
                            });
                          }}
                          disabled={busy}
                          className="h-10 p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Font Family
                        </div>
                        <select
                          value={selected.val.fontFamily ?? FONT_FAMILY}
                          onChange={(e) => {
                            const v = selected.val;
                            if (!isTextField(v)) return;

                            upsertField(selected.key, {
                              ...v,
                              fontFamily: e.target.value || FONT_FAMILY,
                            });
                          }}
                          disabled={busy}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {FONT_FAMILY_OPTIONS.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}

                  {isTextField(selected.val) ? (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Font Weight
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {FONT_WEIGHT_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={
                              selectedFontWeight === option.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            disabled={busy}
                            className={option.previewClass}
                            onClick={() => {
                              const v = selected.val;
                              if (!isTextField(v)) return;

                              upsertField(selected.key, {
                                ...v,
                                fontWeight: option.value,
                              });
                            }}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
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

                  {isImageField(selected.val) ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Lebar</div>
                        <Input
                          value={String(selected.val.width)}
                          onChange={(e) => {
                            const width = Number(e.target.value || 0);
                            const v = selected.val;
                            if (!isImageField(v)) return;

                            upsertField(selected.key, {
                              type: "image",
                              x: v.x,
                              y: v.y,
                              width,
                              height: v.height,
                            });
                          }}
                          disabled={busy}
                          placeholder="260"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Tinggi</div>
                        <Input
                          value={String(selected.val.height)}
                          onChange={(e) => {
                            const height = Number(e.target.value || 0);
                            const v = selected.val;
                            if (!isImageField(v)) return;

                            upsertField(selected.key, {
                              type: "image",
                              x: v.x,
                              y: v.y,
                              width: v.width,
                              height,
                            });
                          }}
                          disabled={busy}
                          placeholder="120"
                        />
                      </div>
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
