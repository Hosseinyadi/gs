import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  onConfirm: (reason: string, reasonText: string) => Promise<void>;
}

const DELETE_REASONS = [
  { value: 'sold', label: 'فروخته شد' },
  { value: 'rented', label: 'اجاره داده شد' },
  { value: 'changed_mind', label: 'پشیمان شدم' },
  { value: 'not_interested', label: 'صرفه‌نظر کردم' },
  { value: 'successful_sale', label: 'فروش موفقیت‌آمیز بود' },
  { value: 'other', label: 'سایر موارد' },
];

const DeleteListingDialog = ({ open, onOpenChange, listingTitle, onConfirm }: DeleteListingDialogProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) return;
    
    setLoading(true);
    try {
      const reasonLabel = DELETE_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
      await onConfirm(selectedReason, reasonText || reasonLabel);
      onOpenChange(false);
      setSelectedReason('');
      setReasonText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            حذف آگهی
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            آیا از حذف آگهی <strong>"{listingTitle}"</strong> اطمینان دارید؟
          </p>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">دلیل حذف آگهی:</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {DELETE_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="cursor-pointer">{reason.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">توضیحات بیشتر:</Label>
              <Textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="لطفاً دلیل حذف را بنویسید..."
                rows={3}
              />
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ توجه: پس از حذف، آگهی به بخش "آگهی‌های حذف شده" منتقل می‌شود و قابل بازیابی نیست.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            انصراف
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={!selectedReason || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال حذف...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 ml-2" />
                حذف آگهی
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteListingDialog;
