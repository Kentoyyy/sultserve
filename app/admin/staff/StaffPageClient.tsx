'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal'

interface Staff {
  id: string
  fullName: string
  email: string
  username: string | null
  phone: string | null
  isActive: boolean
  role: {
    id: string
    name: string
    code: string
  } | null
  stats: {
    processedOrders: number
    activityLogs: number
  }
  lastLoginAt: Date | null
  createdAt: Date
}

interface Role {
  id: string
  code: string
  name: string
  description: string | null
  permissions: any
}

interface Props {
  staff: Staff[]
  roles: Role[]
}

export function StaffPageClient({ staff, roles }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null)
  const router = useRouter()

  const createStaff = async (formData: FormData) => {
    const data = {
      fullName: String(formData.get('fullName') || ''),
      email: String(formData.get('email') || ''),
      username: String(formData.get('username') || '') || null,
      phone: String(formData.get('phone') || '') || null,
      password: String(formData.get('password') || ''),
      roleId: String(formData.get('roleId') || '') || null
    }

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        setIsAddModalOpen(false)
        router.refresh()
      } else {
        const result = await response.json()
        alert(`Failed to create staff: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to create staff:', error)
      alert('Failed to create staff. Please try again.')
    }
  }

  const updateStaff = async (formData: FormData) => {
    if (!selectedStaff) return

    const data = {
      fullName: String(formData.get('fullName') || ''),
      email: String(formData.get('email') || ''),
      username: String(formData.get('username') || '') || null,
      phone: String(formData.get('phone') || '') || null,
      roleId: String(formData.get('roleId') || '') || null,
      isActive: formData.get('isActive') === 'on'
    }

    try {
      const response = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedStaff(null)
        router.refresh()
      } else {
        const result = await response.json()
        alert(`Failed to update staff: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to update staff:', error)
      alert('Failed to update staff. Please try again.')
    }
  }

  const toggleStaffStatus = async (staff: Staff) => {
    try {
      const response = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: !staff.isActive })
      })
      
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to toggle staff status:', error)
    }
  }

  const openEditModal = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (staff: Staff) => {
    setStaffToDelete(staff)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!staffToDelete) return

    try {
      const response = await fetch(`/api/admin/staff/${staffToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setStaffToDelete(null)
        router.refresh()
      } else {
        alert('Failed to delete staff. Please try again.')
      }
    } catch (error) {
      console.error('Failed to delete staff:', error)
      alert('Failed to delete staff. Please try again.')
    }
  }

  const getRoleBadgeColor = (roleCode: string) => {
    const colors = {
      'admin': 'badge bg-red-100 text-red-800',
      'manager': 'badge bg-blue-100 text-blue-800',
      'cashier': 'badge bg-green-100 text-green-800',
      'inventory_clerk': 'badge bg-purple-100 text-purple-800'
    }
    return colors[roleCode as keyof typeof colors] || 'badge badge-neutral'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Staff Management</h1>
          <p className="text-slate-600 mt-1">Manage staff accounts and roles</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </button>
      </div>

      <div className="card">
        {/* Header */}
        <div className="grid grid-cols-7 gap-4 p-4 bg-slate-50 border-b font-medium text-slate-600 text-sm">
          <div>Staff Member</div>
          <div>Contact</div>
          <div className="text-center">Role</div>
          <div className="text-center">Status</div>
          <div className="text-center">Orders</div>
          <div className="text-center">Last Login</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {staff.map((member) => (
            <div key={member.id} className="grid grid-cols-7 gap-4 p-4 hover:bg-slate-50 items-center">
              <div>
                <div className="font-medium text-slate-900">{member.fullName}</div>
                <div className="text-sm text-slate-500">@{member.username || 'no-username'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-900">{member.email}</div>
                {member.phone && (
                  <div className="text-sm text-slate-500">{member.phone}</div>
                )}
              </div>
              <div className="text-center">
                {member.role ? (
                  <span className={getRoleBadgeColor(member.role.code)}>
                    {member.role.name}
                  </span>
                ) : (
                  <span className="text-slate-400">No role</span>
                )}
              </div>
              <div className="text-center">
                <button
                  onClick={() => toggleStaffStatus(member)}
                  className={`badge ${member.isActive ? 'badge-success' : 'badge-neutral'}`}
                >
                  {member.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="text-center">
                <span className="text-slate-900">{member.stats.processedOrders}</span>
              </div>
              <div className="text-center">
                <span className="text-sm text-slate-600">
                  {member.lastLoginAt ? 
                    new Date(member.lastLoginAt).toLocaleDateString() : 
                    'Never'
                  }
                </span>
              </div>
              <div className="text-center">
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => openEditModal(member)}
                    className="btn btn-ghost text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => openDeleteModal(member)}
                    className="btn btn-ghost text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {staff.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-lg font-medium text-slate-900">No staff members yet</p>
                <p className="text-slate-500">Get started by adding your first staff member</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Staff Member">
        <form action={createStaff} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input 
              name="fullName" 
              className="input" 
              placeholder="Enter full name"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input 
              name="email" 
              type="email"
              className="input" 
              placeholder="Enter email address"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
            <input 
              name="username" 
              className="input" 
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input 
              name="phone" 
              className="input" 
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input 
              name="password" 
              type="password"
              className="input" 
              placeholder="Enter password"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
            <select name="roleId" className="select" required>
              <option value="">Select a role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} - {role.description}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Create Staff
            </button>
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)}
              className="btn flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal open={isEditModalOpen} onClose={() => {setIsEditModalOpen(false); setSelectedStaff(null)}} title="Edit Staff Member">
        {selectedStaff && (
          <form action={updateStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input 
                name="fullName" 
                defaultValue={selectedStaff.fullName}
                className="input" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input 
                name="email" 
                type="email"
                defaultValue={selectedStaff.email}
                className="input" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
              <input 
                name="username" 
                defaultValue={selectedStaff.username || ''}
                className="input" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input 
                name="phone" 
                defaultValue={selectedStaff.phone || ''}
                className="input" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select name="roleId" defaultValue={selectedStaff.role?.id || ''} className="select" required>
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input 
                name="isActive"
                type="checkbox" 
                defaultChecked={selectedStaff.isActive}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" 
              />
              <label className="ml-2 block text-sm text-slate-700">
                Active (can login and access system)
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                Update Staff
              </button>
              <button 
                type="button" 
                onClick={() => {setIsEditModalOpen(false); setSelectedStaff(null)}}
                className="btn flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={() => {setIsDeleteModalOpen(false); setStaffToDelete(null)}}
        onConfirm={confirmDelete}
        title="Delete Staff Member"
        message="This will permanently remove the staff member from the system."
        itemName={staffToDelete?.fullName}
        actionType="delete"
      />
    </div>
  )
}

