'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { Download, FileText, Loader2 } from 'lucide-react';

interface PayslipDownloadButtonProps {
  payrollId: string;
  label?: string;
  variant?: 'icon' | 'button';
  className?: string;
}

export function PayslipDownloadButton({
  payrollId,
  label = 'Download Payslip',
  variant = 'button',
  className = '',
}: PayslipDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await apiClient.downloadPayslipPdf(payrollId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payrollId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded', 'Payslip PDF downloaded successfully');
    } catch (err: any) {
      toast.error('Download Failed', err.message || 'Could not download payslip');
    } finally {
      setDownloading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 ${className}`}
        title={label}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 ${className}`}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

interface TaxFormDownloadButtonProps {
  type: 'form16' | 'w2';
  employeeId: string;
  year: number;
  label?: string;
  className?: string;
}

export function TaxFormDownloadButton({
  type,
  employeeId,
  year,
  label,
  className = '',
}: TaxFormDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const defaultLabel = type === 'form16' ? `Form 16 (FY ${year}-${(year + 1).toString().slice(-2)})` : `W-2 (${year})`;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = type === 'form16'
        ? await apiClient.downloadForm16(employeeId, year)
        : await apiClient.downloadW2(employeeId, year);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'form16' ? `form16-${year}.pdf` : `w2-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded', `${type === 'form16' ? 'Form 16' : 'W-2'} downloaded successfully`);
    } catch (err: any) {
      toast.error('Download Failed', err.message || 'Could not download tax form');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 ${className}`}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label || defaultLabel}
    </button>
  );
}
