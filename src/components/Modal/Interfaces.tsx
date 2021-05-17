export interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  callback: () => void;
  closeCallback: () => void;
}
