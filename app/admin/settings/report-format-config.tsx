// app/admin/settings/report-format-config.tsx
'use client'

import { useState, useEffect } from 'react'
import { Save, Palette, Layout, FileText, Eye, Settings } from 'lucide-react'

type ReportFormat = {
  id: string
  reportType: 'MONTHLY' | 'STUDENT' | 'COURSE' | 'OVERALL'
  name: string
  showLogo: boolean
  logoPosition: string
  logoUrl?: string | null
  headerText?: string | null
  footerText?: string | null
  titleFontSize: number
  titleFontFamily: string
  subtitleFontSize: number
  subtitleFontFamily: string
  bodyFontSize: number
  bodyFontFamily: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  pageOrientation: string
  pageSize: string
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  showGeneratedDate: boolean
  showPageNumbers: boolean
  showInstitutionInfo: boolean
  institutionName: string
  institutionAddress?: string | null
  institutionPhone?: string | null
  institutionEmail?: string | null
  monthlyShowStudentDetails: boolean
  monthlyShowPaymentHistory: boolean
  studentShowFeeBreakdown: boolean
  studentShowPaymentTimeline: boolean
  courseShowStudentList: boolean
  overallShowCharts: boolean
  overallShowMonthlyTrends: boolean
}

type Props = {
  formats: ReportFormat[]
}

export function ReportFormatConfig({ formats: initialFormats }: Props) {
  const [formats, setFormats] = useState<ReportFormat[]>(initialFormats)
  const [activeTab, setActiveTab] = useState<'MONTHLY' | 'STUDENT' | 'COURSE' | 'OVERALL'>('MONTHLY')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const activeFormat = formats.find(f => f.reportType === activeTab) || formats[0]

  const updateFormat = (field: keyof ReportFormat, value: any) => {
    setFormats(prev => prev.map(f =>
      f.reportType === activeTab
        ? { ...f, [field]: value }
        : f
    ))
  }

  const saveFormat = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/settings/report-format', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeFormat)
      })

      if (response.ok) {
        setMessage('✅ Report format saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('❌ Failed to save report format')
      }
    } catch (error) {
      setMessage('❌ Error saving report format')
    } finally {
      setSaving(false)
    }
  }

  const fontFamilies = [
    'Helvetica',
    'Helvetica-Bold',
    'Times-Roman',
    'Times-Bold',
    'Courier',
    'Courier-Bold'
  ]

  const pageSizes = ['A4', 'A3', 'Letter', 'Legal']
  const orientations = ['portrait', 'landscape']
  const logoPositions = ['top-left', 'top-center', 'top-right']

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Report Format Configuration</h2>
            <p className="text-purple-100">Customize PDF report appearance and layout</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Report Type Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl">
          {formats.map((format) => (
            <button
              key={format.reportType}
              onClick={() => setActiveTab(format.reportType)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === format.reportType
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {format.name}
            </button>
          ))}
        </div>

        {activeFormat && (
          <div className="space-y-8">
            {/* Basic Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
                  <input
                    type="text"
                    value={activeFormat.name}
                    onChange={(e) => updateFormat('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Header Text</label>
                  <input
                    type="text"
                    value={activeFormat.headerText || ''}
                    onChange={(e) => updateFormat('headerText', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="Optional custom header"
                  />
                </div>
              </div>
            </div>

            {/* Layout Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layout size={20} />
                Layout & Page Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                  <select
                    value={activeFormat.pageSize}
                    onChange={(e) => updateFormat('pageSize', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  >
                    {pageSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                  <select
                    value={activeFormat.pageOrientation}
                    onChange={(e) => updateFormat('pageOrientation', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  >
                    {orientations.map(orientation => (
                      <option key={orientation} value={orientation}>
                        {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo Position</label>
                  <select
                    value={activeFormat.logoPosition}
                    onChange={(e) => updateFormat('logoPosition', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  >
                    {logoPositions.map(position => (
                      <option key={position} value={position}>
                        {position.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-800 mb-3">Margins (points)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'marginTop', label: 'Top' },
                    { key: 'marginBottom', label: 'Bottom' },
                    { key: 'marginLeft', label: 'Left' },
                    { key: 'marginRight', label: 'Right' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type="number"
                        value={activeFormat[key as keyof ReportFormat] as number}
                        onChange={(e) => updateFormat(key as keyof ReportFormat, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        min="0"
                        max="200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Typography Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Typography
              </h3>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Title</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={activeFormat.titleFontFamily}
                        onChange={(e) => updateFormat('titleFontFamily', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {fontFamilies.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={activeFormat.titleFontSize}
                        onChange={(e) => updateFormat('titleFontSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="12"
                        max="48"
                      />
                    </div>
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Subtitle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={activeFormat.subtitleFontFamily}
                        onChange={(e) => updateFormat('subtitleFontFamily', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {fontFamilies.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={activeFormat.subtitleFontSize}
                        onChange={(e) => updateFormat('subtitleFontSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="8"
                        max="24"
                      />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Body Text</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={activeFormat.bodyFontFamily}
                        onChange={(e) => updateFormat('bodyFontFamily', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {fontFamilies.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={activeFormat.bodyFontSize}
                        onChange={(e) => updateFormat('bodyFontSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="8"
                        max="16"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Palette size={20} />
                Colors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'primaryColor', label: 'Primary Color', default: '#1f2937' },
                  { key: 'secondaryColor', label: 'Secondary Color', default: '#6b7280' },
                  { key: 'accentColor', label: 'Accent Color', default: '#3b82f6' },
                  { key: 'backgroundColor', label: 'Background Color', default: '#ffffff' }
                ].map(({ key, label, default: defaultColor }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={activeFormat[key as keyof ReportFormat] as string}
                        onChange={(e) => updateFormat(key as keyof ReportFormat, e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={activeFormat[key as keyof ReportFormat] as string}
                        onChange={(e) => updateFormat(key as keyof ReportFormat, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                        placeholder={defaultColor}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye size={20} />
                Content & Features
              </h3>
              <div className="space-y-4">
                {/* General Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFormat.showLogo}
                      onChange={(e) => updateFormat('showLogo', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Logo</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFormat.showGeneratedDate}
                      onChange={(e) => updateFormat('showGeneratedDate', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Generated Date</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFormat.showPageNumbers}
                      onChange={(e) => updateFormat('showPageNumbers', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Page Numbers</span>
                  </label>
                </div>

                {/* Institution Info */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Institution Information</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFormat.showInstitutionInfo}
                        onChange={(e) => updateFormat('showInstitutionInfo', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show Institution Info</span>
                    </label>
                    {activeFormat.showInstitutionInfo && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <input
                          type="text"
                          value={activeFormat.institutionName}
                          onChange={(e) => updateFormat('institutionName', e.target.value)}
                          placeholder="Institution Name"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <input
                          type="text"
                          value={activeFormat.institutionAddress || ''}
                          onChange={(e) => updateFormat('institutionAddress', e.target.value)}
                          placeholder="Address"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <input
                          type="text"
                          value={activeFormat.institutionPhone || ''}
                          onChange={(e) => updateFormat('institutionPhone', e.target.value)}
                          placeholder="Phone"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <input
                          type="email"
                          value={activeFormat.institutionEmail || ''}
                          onChange={(e) => updateFormat('institutionEmail', e.target.value)}
                          placeholder="Email"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Report-specific Options */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Report-Specific Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeFormat.reportType === 'MONTHLY' && (
                      <>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={activeFormat.monthlyShowStudentDetails}
                            onChange={(e) => updateFormat('monthlyShowStudentDetails', e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Show Student Details</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={activeFormat.monthlyShowPaymentHistory}
                            onChange={(e) => updateFormat('monthlyShowPaymentHistory', e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Show Payment History</span>
                        </label>
                      </>
                    )}
                    {activeFormat.reportType === 'STUDENT' && (
                      <>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={activeFormat.studentShowFeeBreakdown}
                            onChange={(e) => updateFormat('studentShowFeeBreakdown', e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Show Fee Breakdown</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={activeFormat.studentShowPaymentTimeline}
                            onChange={(e) => updateFormat('studentShowPaymentTimeline', e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Show Payment Timeline</span>
                        </label>
                      </>
                    )}
                    {activeFormat.reportType === 'COURSE' && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={activeFormat.courseShowStudentList}
                          onChange={(e) => updateFormat('courseShowStudentList', e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show Student List</span>
                      </label>
                    )}
                    {activeFormat.reportType === 'OVERALL' && (
                      <>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={activeFormat.overallShowCharts}
                            onChange={(e) => updateFormat('overallShowCharts', e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Show Charts</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={activeFormat.overallShowMonthlyTrends}
                            onChange={(e) => updateFormat('overallShowMonthlyTrends', e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Show Monthly Trends</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                Changes are saved automatically for each report type
              </div>
              <button
                onClick={saveFormat}
                disabled={saving}
                className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 flex items-center gap-2 ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Format
                  </>
                )}
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-4 rounded-lg text-center font-medium ${
                message.includes('✅')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}