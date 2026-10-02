import "./ConfirmDialog.css";

/**
 * 확인 팝업. 와이어프레임 09-2 ARCHIVE — DELETE CONFIRM.png 기준
 * (반투명 오버레이 위 둥근 카드 + 라벨·제목·설명·취소/실행 버튼 2개).
 */
export function ConfirmDialog({
  eyebrow,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog" role="alertdialog" aria-modal="true">
        <p className="confirm-dialog-eyebrow">{eyebrow}</p>
        <h2 className="confirm-dialog-title">{title}</h2>
        <p className="confirm-dialog-description">{description}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-cancel" onClick={onCancel}>
            <span>{cancelLabel}</span>
            <span aria-hidden="true">✕</span>
          </button>
          <button type="button" className="confirm-dialog-confirm" onClick={onConfirm}>
            <span>{confirmLabel}</span>
            <span aria-hidden="true">🗑</span>
          </button>
        </div>
      </div>
    </div>
  );
}
