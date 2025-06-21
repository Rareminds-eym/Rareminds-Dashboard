import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
}

interface ConfirmModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  isLoading?: boolean
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4"
}

const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}
        
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title = "Confirm Action",
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
  size = "sm",
  className,
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  const handleConfirm = () => {
    onConfirm()
  }

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={isLoading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant === "destructive" ? "destructive" : "default"}
        onClick={handleConfirm}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : confirmText}
      </Button>
    </>
  )

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      size={size}
      className={className}
    />
  )
}

export { Modal, ConfirmModal }
export type { ModalProps, ConfirmModalProps }
