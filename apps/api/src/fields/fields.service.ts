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

    ucResponse.result.forEach((ucField) => {
      // Extract venue name from field name or use field name as fallback
      const venueName = this.extractVenueName(ucField.name) || ucField.name;

      if (!venueMap.has(venueName)) {
        venueMap.set(venueName, []);
      }
      venueMap.get(venueName)!.push(ucField);
    });

    // Transform to our domain model
    const fields: Field[] = [];
    venueMap.forEach((ucFields, venueName) => {
      const primaryField = ucFields[0];

      // Determine if this venue has subfields or is a single field
      const hasSubfields =
        ucFields.length > 1 ||
        (ucFields.length === 1 &&
          this.extractVenueName(ucFields[0].name) !== null);

      const subfields: Subfield[] = hasSubfields
        ? ucFields.map((ucField) => ({
            id: ucField.id.toString(),
            name: ucField.name,
            surface: ucField.surface,
            externalRefs: {
              uc: {
                eventId: eventId,
                orgId: ucField.organization_id,
                slug: ucField.slug,
              },
            },
            meta: {
              contactPhone: ucField.contact_phone_number,
            },
          }))
        : []; // No subfields for single venues

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
          fieldCount: hasSubfields ? subfields.length : 1,
          isSingleField: !hasSubfields,
        },
      });
    });

    return fields;
  }

  private extractVenueName(fieldName: string): string | null {
    // Try to extract venue name from field name
    // Common patterns: "Venue Name - Field Name", "Venue Name Field N"
    const patterns = [
      /^(.+?)\s*-\s*.+$/, // "Venue - Field"
      /^(.+?)\s+Field\s+\d+$/, // "Venue Field N"
      /^(.+?)\s+Pitch\s*\d*$/, // "Venue Pitch N"
    ];

    for (const pattern of patterns) {
      const match = fieldName.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // If no pattern matches, return the first part before common field indicators
    // Only if they clearly indicate a field subdivision (i.e., followed by a number or letter)
    const fieldIndicators = [
      { indicator: 'Field', pattern: /^(.+?)\s+Field\s+[A-Z0-9]/i },
      { indicator: 'Pitch', pattern: /^(.+?)\s+Pitch\s+[A-Z0-9]/i },
      { indicator: 'Court', pattern: /^(.+?)\s+Court\s+[A-Z0-9]/i },
    ];

    for (const { pattern } of fieldIndicators) {
      const match = fieldName.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // If the field name ends with just "Field", "Pitch", or "Court" without subdivision,
    // treat the entire name as the venue
    return null;
  }

  private getCommonSurface(ucFields: UCField[]): string | undefined {
    const surfaces = ucFields.map((f) => f.surface).filter(Boolean);
    if (surfaces.length === 0) return undefined;

    // Return the most common surface, or the first one if all are the same
    const surfaceCount = surfaces.reduce(
      (acc, surface) => {
        acc[surface!] = (acc[surface!] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(surfaceCount).sort(([, a], [, b]) => b - a)[0][0];
  }
}
