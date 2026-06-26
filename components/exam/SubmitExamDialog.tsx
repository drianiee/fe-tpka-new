import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SubmitExamDialogProps = {
  open: boolean;
  answered: number;
  total: number;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SubmitExamDialog({
  open,
  submitting,
  onOpenChange,
  onConfirm,
}: SubmitExamDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selesaikan ujian?</DialogTitle>
          <DialogDescription>
            Pastikan jawaban Anda sudah sesuai. Setelah ujian diselesaikan
            jawaban tidak dapat diubah lagi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cek Lagi
          </Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting ? "Memproses..." : "Selesaikan Ujian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
