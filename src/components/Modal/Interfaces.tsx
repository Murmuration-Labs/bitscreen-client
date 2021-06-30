export interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  bullets?: string[];
  callback: () => void;
  closeCallback: () => void;
}
