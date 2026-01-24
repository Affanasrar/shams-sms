// components/pdf/base-template.tsx
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import fs from 'fs'
import path from 'path'

type ReportFormat = {
  id: string
  reportType: string
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
}

interface BaseTemplateProps {
  title: string
  subtitle?: string
  generatedAt: Date
  format: ReportFormat
  children: React.ReactNode
}

export function BaseTemplate({ title, subtitle, generatedAt, format, children }: BaseTemplateProps) {
  // Get logo as base64
  const getLogoSrc = () => {
    // If a custom logo URL is provided, try to load it
    if (format.logoUrl) {
      try {
        const logoPath = path.join(process.cwd(), 'public', format.logoUrl)
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath)
          const base64 = logoBuffer.toString('base64')
          const ext = path.extname(format.logoUrl).toLowerCase().slice(1)
          const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`
          return `data:${mimeType};base64,${base64}`
        }
      } catch (error) {
        console.warn(`Custom logo file could not be read:`, error)
      }
    }

    // Fall back to default logo files
    const logoExtensions = ['png', 'jpg', 'jpeg', 'svg']
    const publicPath = path.join(process.cwd(), 'public', 'assets', 'images')

    for (const ext of logoExtensions) {
      try {
        const logoPath = path.join(publicPath, `logo.${ext}`)
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath)
          const base64 = logoBuffer.toString('base64')
          const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`
          return `data:${mimeType};base64,${base64}`
        }
      } catch (error) {
        console.warn(`Logo file logo.${ext} could not be read:`, error)
      }
    }

    console.warn('No logo file found')
    return null
  }

  const logoSrc = getLogoSrc()

  // Create dynamic styles based on format
  const dynamicStyles = StyleSheet.create({
    page: {
      backgroundColor: format.backgroundColor,
      paddingTop: format.marginTop,
      paddingBottom: format.marginBottom,
      paddingLeft: format.marginLeft,
      paddingRight: format.marginRight,
      fontFamily: format.bodyFontFamily,
      fontSize: format.bodyFontSize,
    },
    header: {
      marginBottom: 20,
      borderBottom: 2,
      borderBottomColor: format.accentColor,
      paddingBottom: 10,
      flexDirection: 'row',
      justifyContent: format.logoPosition.includes('right') ? 'space-between' : 'flex-start',
      alignItems: 'center',
    },
    title: {
      fontSize: format.titleFontSize,
      fontFamily: format.titleFontFamily,
      color: format.primaryColor,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: format.subtitleFontSize,
      fontFamily: format.subtitleFontFamily,
      color: format.secondaryColor,
      marginBottom: 10,
    },
    metadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    metadataItem: {
      fontSize: format.bodyFontSize - 1,
      color: format.secondaryColor,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: format.subtitleFontSize,
      fontFamily: format.subtitleFontFamily,
      color: format.primaryColor,
      marginBottom: 10,
      fontWeight: 'bold',
    },
    footer: {
      position: 'absolute',
      bottom: format.marginBottom,
      left: format.marginLeft,
      right: format.marginRight,
      textAlign: 'center',
      fontSize: format.bodyFontSize - 2,
      color: format.secondaryColor,
      borderTop: 1,
      borderTopColor: format.secondaryColor,
      paddingTop: 10,
    },
    institutionInfo: {
      textAlign: 'center',
      marginBottom: 15,
    },
    institutionName: {
      fontSize: format.titleFontSize - 2,
      fontFamily: format.titleFontFamily,
      color: format.primaryColor,
      marginBottom: 5,
    },
    institutionDetail: {
      fontSize: format.bodyFontSize - 1,
      color: format.secondaryColor,
      marginBottom: 2,
    },
    logo: {
      width: 60,
      height: 60,
      marginRight: format.logoPosition.includes('left') ? 15 : 0,
      marginLeft: format.logoPosition.includes('right') ? 15 : 0,
    }
  })

  // Page size mapping
  const pageSizeMap = {
    'A4': 'A4',
    'A3': 'A3',
    'Letter': 'LETTER',
    'Legal': 'LEGAL'
  }

  return (
    <Document>
      <Page
        size={format.pageSize as any}
        orientation={format.pageOrientation as 'portrait' | 'landscape'}
        style={dynamicStyles.page}
      >
        {/* Institution Info */}
        {format.showInstitutionInfo && (
          <View style={dynamicStyles.institutionInfo}>
            <Text style={dynamicStyles.institutionName}>{format.institutionName}</Text>
            {format.institutionAddress && (
              <Text style={dynamicStyles.institutionDetail}>{format.institutionAddress}</Text>
            )}
            {format.institutionPhone && (
              <Text style={dynamicStyles.institutionDetail}>Phone: {format.institutionPhone}</Text>
            )}
            {format.institutionEmail && (
              <Text style={dynamicStyles.institutionDetail}>Email: {format.institutionEmail}</Text>
            )}
          </View>
        )}

        {/* Header */}
        <View style={dynamicStyles.header}>
          {format.showLogo && format.logoPosition.includes('left') && logoSrc && (
            <Image
              src={logoSrc}
              style={dynamicStyles.logo}
            />
          )}

          <View style={{ flex: 1 }}>
            <Text style={dynamicStyles.title}>{format.headerText || title}</Text>
            {subtitle && <Text style={dynamicStyles.subtitle}>{subtitle}</Text>}
          </View>

          {format.showLogo && format.logoPosition.includes('right') && logoSrc && (
            <Image
              src={logoSrc}
              style={dynamicStyles.logo}
            />
          )}
        </View>

        {/* Metadata */}
        {format.showGeneratedDate && (
          <View style={dynamicStyles.metadata}>
            <Text style={dynamicStyles.metadataItem}>
              Generated: {generatedAt.toLocaleDateString()} {generatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
            <Text style={dynamicStyles.metadataItem}>
              Report: {format.name}
            </Text>
          </View>
        )}

        {/* Main Content */}
        {children}

        {/* Footer */}
        {format.footerText && (
          <View style={dynamicStyles.footer}>
            <Text>{format.footerText}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}