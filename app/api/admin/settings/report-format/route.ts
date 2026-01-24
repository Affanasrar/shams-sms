// app/api/admin/settings/report-format/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      reportType,
      name,
      showLogo,
      logoPosition,
      logoUrl,
      headerText,
      footerText,
      titleFontSize,
      titleFontFamily,
      subtitleFontSize,
      subtitleFontFamily,
      bodyFontSize,
      bodyFontFamily,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      pageOrientation,
      pageSize,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      showGeneratedDate,
      showPageNumbers,
      showInstitutionInfo,
      institutionName,
      institutionAddress,
      institutionPhone,
      institutionEmail,
      monthlyShowStudentDetails,
      monthlyShowPaymentHistory,
      studentShowFeeBreakdown,
      studentShowPaymentTimeline,
      courseShowStudentList,
      overallShowCharts,
      overallShowMonthlyTrends
    } = body

    // Update the report format
    const updatedFormat = await prisma.reportFormat.update({
      where: { id },
      data: {
        name,
        showLogo,
        logoPosition,
        logoUrl,
        headerText,
        footerText,
        titleFontSize,
        titleFontFamily,
        subtitleFontSize,
        subtitleFontFamily,
        bodyFontSize,
        bodyFontFamily,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        pageOrientation,
        pageSize,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        showGeneratedDate,
        showPageNumbers,
        showInstitutionInfo,
        institutionName,
        institutionAddress,
        institutionPhone,
        institutionEmail,
        monthlyShowStudentDetails,
        monthlyShowPaymentHistory,
        studentShowFeeBreakdown,
        studentShowPaymentTimeline,
        courseShowStudentList,
        overallShowCharts,
        overallShowMonthlyTrends
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Report format updated successfully',
      format: updatedFormat
    })

  } catch (error) {
    console.error('Error updating report format:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update report format' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const formats = await prisma.reportFormat.findMany({
      orderBy: { reportType: 'asc' }
    })

    return NextResponse.json({
      success: true,
      formats
    })

  } catch (error) {
    console.error('Error fetching report formats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report formats' },
      { status: 500 }
    )
  }
}