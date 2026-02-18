'use client';

/**
 * Employee Form Component
 * Create and edit employee with validation
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployee } from '@/hooks/use-employee';
import type { CreateEmployeeData, Employee } from '@/lib/api-client';
import { Loader2, Save, X } from 'lucide-react';

interface EmployeeFormProps {
  mode: 'create' | 'edit';
  employeeId?: string;
  initialData?: Employee;
}

export function EmployeeForm({ mode, employeeId, initialData }: EmployeeFormProps) {
  const router = useRouter();
  const { employee, createEmployee, updateEmployee, loading } = useEmployee(employeeId);

  const effectiveData = initialData || employee;

  const [formData, setFormData] = useState<Partial<CreateEmployeeData>>({
    employeeCode: effectiveData?.employeeCode || '',
    firstName: effectiveData?.firstName || '',
    middleName: effectiveData?.middleName || '',
    lastName: effectiveData?.lastName || '',
    workEmail: effectiveData?.workEmail || '',
    personalEmail: effectiveData?.personalEmail || '',
    workPhone: effectiveData?.workPhone || '',
    personalPhone: effectiveData?.personalPhone || '',
    dateOfBirth: effectiveData?.dateOfBirth || '',
    gender: effectiveData?.gender,
    dateOfJoining: effectiveData?.dateOfJoining || '',
    employmentType: effectiveData?.employmentType || 'FULL_TIME',
    status: effectiveData?.status || 'ACTIVE',
    aadhaar: effectiveData?.aadhaar || '',
    pan: effectiveData?.pan || '',
    passport: effectiveData?.passport || '',
    addressLine1: effectiveData?.addressLine1 || '',
    addressLine2: effectiveData?.addressLine2 || '',
    city: effectiveData?.city || '',
    state: effectiveData?.state || '',
    postalCode: effectiveData?.postalCode || '',
    country: effectiveData?.country || 'India',
    departmentId: effectiveData?.department?.id || '',
    designationId: effectiveData?.designation?.id || '',
    reportingManagerId: effectiveData?.reportingManager?.id || '',
    probationEndDate: effectiveData?.probationEndDate || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when employee data is fetched (edit mode)
  useEffect(() => {
    if (employee && mode === 'edit') {
      setFormData({
        employeeCode: employee.employeeCode || '',
        firstName: employee.firstName || '',
        middleName: employee.middleName || '',
        lastName: employee.lastName || '',
        workEmail: employee.workEmail || '',
        personalEmail: employee.personalEmail || '',
        workPhone: employee.workPhone || '',
        personalPhone: employee.personalPhone || '',
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
        gender: employee.gender,
        dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.split('T')[0] : '',
        employmentType: employee.employmentType || 'FULL_TIME',
        status: employee.status || 'ACTIVE',
        aadhaar: employee.aadhaar || '',
        pan: employee.pan || '',
        passport: employee.passport || '',
        addressLine1: employee.addressLine1 || '',
        addressLine2: employee.addressLine2 || '',
        city: employee.city || '',
        state: employee.state || '',
        postalCode: employee.postalCode || '',
        country: employee.country || 'India',
        departmentId: employee.department?.id || '',
        designationId: employee.designation?.id || '',
        reportingManagerId: employee.reportingManager?.id || '',
        probationEndDate: employee.probationEndDate ? employee.probationEndDate.split('T')[0] : '',
      });
    }
  }, [employee, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.employeeCode) newErrors.employeeCode = 'Employee code is required';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.workEmail) newErrors.workEmail = 'Work email is required';
    if (!formData.dateOfJoining) newErrors.dateOfJoining = 'Date of joining is required';
    if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.workEmail && !emailRegex.test(formData.workEmail)) {
      newErrors.workEmail = 'Invalid email format';
    }
    if (formData.personalEmail && !emailRegex.test(formData.personalEmail)) {
      newErrors.personalEmail = 'Invalid email format';
    }

    // PAN validation
    if (formData.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(formData.pan)) {
        newErrors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
      }
    }

    // Aadhaar validation
    if (formData.aadhaar) {
      const aadhaarRegex = /^[0-9]{12}$/;
      if (!aadhaarRegex.test(formData.aadhaar)) {
        newErrors.aadhaar = 'Invalid Aadhaar format (12 digits)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Strip empty strings from optional fields before sending to API
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
      ) as Partial<CreateEmployeeData>;

      if (mode === 'create') {
        await createEmployee(cleanedData as CreateEmployeeData);
        router.push('/employees');
      } else if (mode === 'edit' && employeeId) {
        await updateEmployee(employeeId, cleanedData);
        router.push(`/employees/${employeeId}`);
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save employee' });
    }
  };

  const handleChange = (field: keyof CreateEmployeeData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'New Employee' : 'Edit Employee'}
          </h1>
          <p className="mt-2 text-gray-600">
            {mode === 'create'
              ? 'Add a new employee to your organization'
              : 'Update employee information'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
          Cancel
        </button>
      </div>

      {errors.submit && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{errors.submit}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.employeeCode}
                onChange={(e) => handleChange('employeeCode', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.employeeCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="EMP001"
              />
              {errors.employeeCode && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.workEmail}
                onChange={(e) => handleChange('workEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.workEmail ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="john.doe@company.com"
              />
              {errors.workEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.workEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Middle Name
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => handleChange('middleName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Personal Email
              </label>
              <input
                type="email"
                value={formData.personalEmail}
                onChange={(e) => handleChange('personalEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.personalEmail ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="john@gmail.com"
              />
              {errors.personalEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.personalEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Work Phone
              </label>
              <input
                type="tel"
                value={formData.workPhone}
                onChange={(e) => handleChange('workPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Personal Phone
              </label>
              <input
                type="tel"
                value={formData.personalPhone}
                onChange={(e) => handleChange('personalPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </div>

        {/* Government IDs */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Government IDs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Aadhaar Number
              </label>
              <input
                type="text"
                value={formData.aadhaar}
                onChange={(e) => handleChange('aadhaar', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.aadhaar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="123456789012"
                maxLength={12}
              />
              {errors.aadhaar && (
                <p className="mt-1 text-sm text-red-600">{errors.aadhaar}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                PAN Number
              </label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.pan ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
              {errors.pan && <p className="mt-1 text-sm text-red-600">{errors.pan}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Passport Number
              </label>
              <input
                type="text"
                value={formData.passport}
                onChange={(e) => handleChange('passport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Employment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date of Joining <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => handleChange('dateOfJoining', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dateOfJoining ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateOfJoining && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfJoining}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Employment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.employmentType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
              {errors.employmentType && (
                <p className="mt-1 text-sm text-red-600">{errors.employmentType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_NOTICE">On Notice</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Probation End Date
              </label>
              <input
                type="date"
                value={formData.probationEndDate || ''}
                onChange={(e) => handleChange('probationEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Address</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {mode === 'create' ? 'Create Employee' : 'Update Employee'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
