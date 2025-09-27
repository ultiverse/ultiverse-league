import { Injectable } from '@nestjs/common';
import { UCFieldsService } from '../integrations/uc/uc.fields/uc.fields.service';
import { Field, Subfield } from '../domain/models';
import { UCField } from '../integrations/uc/types/fields';

@Injectable()
export class FieldsService {
  constructor(private readonly ucFieldsService: UCFieldsService) {}

  async getFieldsByEventId(eventId: number): Promise<Field[]> {
    const ucResponse = await this.ucFieldsService.list({ event_id: eventId });

    // Group UC fields by venue (for now, each UC field becomes a subfield)
    // Later we can implement more sophisticated venue grouping logic
    const venueMap = new Map<string, UCField[]>();

    ucResponse.result.forEach(ucField => {
      // Extract venue name from field name or use organization as fallback
      const venueName = this.extractVenueName(ucField.name) || `Organization ${ucField.organization_id}`;

      if (!venueMap.has(venueName)) {
        venueMap.set(venueName, []);
      }
      venueMap.get(venueName)!.push(ucField);
    });

    // Transform to our domain model
    const fields: Field[] = [];
    venueMap.forEach((ucFields, venueName) => {
      const subfields: Subfield[] = ucFields.map(ucField => ({
        id: ucField.id.toString(),
        name: ucField.name,
        surface: ucField.surface,
        externalRefs: {
          uc: {
            fieldId: ucField.id,
            organizationId: ucField.organization_id,
            locationId: ucField.location_id,
            pageId: ucField.page_id,
            slug: ucField.slug,
          },
        },
        meta: {
          contactPhone: ucField.contact_phone_number,
        },
      }));

      // Use the first field's ID as the venue ID for now
      const primaryField = ucFields[0];
      fields.push({
        id: `venue-${primaryField.organization_id}-${venueName.replace(/\s+/g, '-').toLowerCase()}`,
        name: venueName,
        venue: venueName,
        subfields,
        map: primaryField.website_url,
        surface: this.getCommonSurface(ucFields),
        externalRefs: {
          uc: {
            orgId: primaryField.organization_id,
            eventId: eventId,
          },
        },
        meta: {
          fieldCount: subfields.length,
        },
      });
    });

    return fields;
  }

  private extractVenueName(fieldName: string): string | null {
    // Try to extract venue name from field name
    // Common patterns: "Venue Name - Field Name", "Venue Name Field N"
    const patterns = [
      /^(.+?)\s*-\s*.+$/,  // "Venue - Field"
      /^(.+?)\s+Field\s+\d+$/,  // "Venue Field N"
      /^(.+?)\s+Pitch\s*\d*$/,  // "Venue Pitch N"
    ];

    for (const pattern of patterns) {
      const match = fieldName.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // If no pattern matches, return the first part before common field indicators
    const fieldIndicators = ['Field', 'Pitch', 'Court', '-'];
    for (const indicator of fieldIndicators) {
      const index = fieldName.indexOf(indicator);
      if (index > 0) {
        return fieldName.substring(0, index).trim();
      }
    }

    return null;
  }

  private getCommonSurface(ucFields: UCField[]): string | undefined {
    const surfaces = ucFields.map(f => f.surface).filter(Boolean);
    if (surfaces.length === 0) return undefined;

    // Return the most common surface, or the first one if all are the same
    const surfaceCount = surfaces.reduce((acc, surface) => {
      acc[surface!] = (acc[surface!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(surfaceCount)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
}