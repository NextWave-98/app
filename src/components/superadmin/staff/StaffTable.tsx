import type { Staff } from '../../../types/staff.types';
import { StaffStatus } from '../../../types/staff.types';
import StaffStatusBadge from './StaffStatusBadge';
import StaffRoleBadge from './StaffRoleBadge';
import { User, Phone, Mail, MapPin, Edit, Trash2, MoreVertical, Building2 } from 'lucide-react';
import { useState } from 'react';
import Pagination from '../../common/Pagination';

interface StaffTableProps {
  staff: Staff[];
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  onView?: (staff: Staff) => void;
  onAssignBranch?: (staff: Staff) => void;
  onActivate?: (staff: Staff) => void;
  onDeactivate?: (staff: Staff) => void;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  // Selection props
  selectable?: boolean;
  selectedStaff?: Staff[];
  onSelectionChange?: (staff: Staff[]) => void;
}

export default function StaffTable({
  staff,
  onEdit,
  onDelete,
  onView,
  onAssignBranch,
  onActivate,
  // onDeactivate,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  onPageChange,
  onItemsPerPageChange,
  selectable = false,
  selectedStaff = [],
  onSelectionChange
}: StaffTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);


  const toggleMenu = (staffId: string) => {
    setActiveMenu(activeMenu === staffId ? null : staffId);
  };

  const isSelected = (member: Staff) => {
    return selectedStaff.some(selected => selected.id === member.id);
  };

  const handleSelectStaff = (member: Staff) => {
    if (!onSelectionChange) return;

    if (isSelected(member)) {
      onSelectionChange(selectedStaff.filter(selected => selected.id !== member.id));
    } else {
      onSelectionChange([...selectedStaff, member]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedStaff.length === staff.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(staff);
    }
  };

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <User className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff found</h3>
        <p className="text-gray-600">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedStaff.length === staff.length && staff.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shop/Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th> */}
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onView?.(member)}
              >
                {selectable && (
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected(member)}
                      onChange={() => handleSelectStaff(member)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{member.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StaffRoleBadge role={member.role} />
                  {/* <div className="text-xs text-gray-500 mt-1">{member.department}</div> */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.location?.name || 'Not Assigned'}</div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {member.location?.locationCode || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <Mail className="w-3 h-3 mr-1 text-gray-400" />
                    {member.email}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Phone className="w-3 h-3 mr-1 text-gray-400" />
                    {member.phone}
                  </div>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                  {renderPerformanceStars(member.performanceRating)}
                  {member.totalSales && (
                    <div className="text-xs text-gray-500 mt-1">
                      Sales: {formatCurrency(member.totalSales)}
                    </div>
                  )}
                  {member.completedJobSheets && (
                    <div className="text-xs text-gray-500 mt-1">
                      Jobs: {member.completedJobSheets}
                    </div>
                  )}
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <StaffStatusBadge status={member.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls (shared) */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />
    </div>
  );
}
