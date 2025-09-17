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
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

  // Filter staff based on search and filters
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || member.role?.code === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-600 mt-1">Manage staff accounts and roles</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.code}>{role.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredStaff.length} of {staff.length} staff members
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <div className="col-span-3">Staff Member</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-2 text-center">Role</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Orders</div>
            <div className="col-span-1 text-center">Last Login</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-200">
          {filteredStaff.map((member) => (
            <div key={member.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Staff Member */}
                <div className="col-span-3">
                  <div className="font-medium text-slate-900">{member.fullName}</div>
                  <div className="text-sm text-slate-500">@{member.username || 'no-username'}</div>
                </div>

                {/* Contact */}
                <div className="col-span-2">
                  <div className="text-sm text-slate-900">{member.email}</div>
                  {member.phone && (
                    <div className="text-sm text-slate-500">{member.phone}</div>
                  )}
                </div>

                {/* Role */}
                <div className="col-span-2 text-center">
                  {member.role ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role.code === 'admin' ? 'bg-red-100 text-red-800' :
                      member.role.code === 'manager' ? 'bg-blue-100 text-blue-800' :
                      member.role.code === 'cashier' ? 'bg-green-100 text-green-800' :
                      member.role.code === 'inventory_clerk' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {member.role.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">No role</span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => toggleStaffStatus(member)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      member.isActive 
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Orders */}
                <div className="col-span-1 text-center">
                  <span className="text-slate-900 font-medium">{member.stats.processedOrders}</span>
                </div>

                {/* Last Login */}
                <div className="col-span-1 text-center">
                  <span className="text-sm text-slate-600">
                    {member.lastLoginAt ? 
                      new Date(member.lastLoginAt).toLocaleDateString() : 
                      'Never'
                    }
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 text-center">
                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={() => openEditModal(member)}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => openDeleteModal(member)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredStaff.length === 0 && (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' ? 'No staff found' : 'No staff members yet'}
                </p>
                <p className="text-slate-500">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by adding your first staff member'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Staff Member">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add Staff Member</h3>
            <p className="text-sm text-slate-600 mt-1">Create a new staff account with role-based access</p>
          </div>

          <form action={createStaff} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Personal Information</h4>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  name="fullName" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  placeholder="Enter full name"
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                <input 
                  name="email" 
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  placeholder="Enter email address"
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                <input 
                  name="phone" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  placeholder="Enter phone number (optional)"
                />
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Account Information</h4>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Username</label>
                <input 
                  name="username" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  placeholder="Enter username (optional)"
                />
                <p className="text-xs text-slate-500">Leave empty to use email as username</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <input 
                  name="password" 
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  placeholder="Enter password"
                  required 
                />
                <p className="text-xs text-slate-500">Minimum 6 characters</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Role</label>
                <select name="roleId" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" required>
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">Choose the appropriate role for this staff member</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button 
                type="submit" 
                className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
              >
                Create Staff
              </button>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal open={isEditModalOpen} onClose={() => {setIsEditModalOpen(false); setSelectedStaff(null)}} title="Edit Staff Member">
        {selectedStaff && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">Edit Staff Member</h3>
              <p className="text-sm text-slate-600 mt-1">Update staff information and permissions</p>
            </div>

            <form action={updateStaff} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Personal Information</h4>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                  <input 
                    name="fullName" 
                    defaultValue={selectedStaff.fullName}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                  <input 
                    name="email" 
                    type="email"
                    defaultValue={selectedStaff.email}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                  <input 
                    name="phone" 
                    defaultValue={selectedStaff.phone || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  />
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Account Information</h4>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Username</label>
                  <input 
                    name="username" 
                    defaultValue={selectedStaff.username || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Role</label>
                  <select name="roleId" defaultValue={selectedStaff.role?.id || ''} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" required>
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input 
                      name="isActive"
                      type="checkbox" 
                      defaultChecked={selectedStaff.isActive}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded" 
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-700">Active Status</span>
                      <p className="text-xs text-slate-500">Allow this staff member to login and access the system</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button 
                  type="submit" 
                  className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                >
                  Update Staff
                </button>
                <button 
                  type="button" 
                  onClick={() => {setIsEditModalOpen(false); setSelectedStaff(null)}}
                  className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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


