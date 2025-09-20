'use client'

import { useEffect, useRef } from 'react'

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName?: string
  actionType?: 'delete' | 'restore' | 'archive'
}

export function DeleteConfirmModal({ open, onClose, onConfirm, title, message, itemName, actionType = 'delete' }: DeleteConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getIconConfig = () => {
    switch (actionType) {
      case 'restore':
        return {
          bgColor: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )
        }
      case 'archive':
        return {
          bgColor: 'bg-amber-100',
          iconColor: 'text-amber-600',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 10-10M9 16l2 2 4-4M5 2h14v20H5z" />
            </svg>
          )
        }
      default:
        return {
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )
        }
    }
  }

  const getActionText = () => {
    switch (actionType) {
      case 'restore':
        return {
          actionLabel: 'You are about to restore:',
          buttonText: 'Restore',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-colors font-medium',
          warning: 'Are you sure you want to continue?'
        }
      case 'archive':
        return {
          actionLabel: 'You are about to archive:',
          buttonText: 'Archive',
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors font-medium',
          warning: 'Are you sure you want to continue?'
        }
      default:
        return {
          actionLabel: 'You are about to delete:',
          buttonText: 'Delete',
          buttonClass: 'btn-danger',
          warning: 'This action cannot be undone. Are you sure you want to continue?'
        }
    }
  }

  const iconConfig = getIconConfig()
  const actionConfig = getActionText()

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 rounded-lg border-0 p-0 w-full max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      onClose={onClose}
    >
      <div className="bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-3 p-6 border-b">
          <div className={`w-10 h-10 ${iconConfig.bgColor} rounded-full flex items-center justify-center`}>
            <div className={iconConfig.iconColor}>
              {iconConfig.icon}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
          </div>
        </div>
        
        {itemName && (
          <div className="px-6 py-3 bg-slate-50">
            <p className="text-sm text-slate-600">{actionConfig.actionLabel}</p>
            <p className="font-medium text-slate-900">&quot;{itemName}&quot;</p>
          </div>
        )}
        
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">{actionConfig.warning}</p>
          
          <div className="flex gap-3">
            <button 
              onClick={handleConfirm}
              className={`${actionConfig.buttonClass} flex-1`}
            >
              {actionConfig.buttonText}
            </button>
            <button 
              onClick={onClose}
              className="btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
