import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * CSV Utility Service
 * Manual CSV parsing and generation without external dependencies.
 * Handles BOM removal, quoted fields, empty rows, and whitespace trimming.
 */
@Injectable()
export class CsvService {
  /**
   * Parse a CSV buffer into an array of row objects.
   * @param buffer - Raw CSV file buffer
   * @param expectedHeaders - Array of expected header names (lowercase, trimmed)
   * @returns Array of objects keyed by header name
   */
  parseCSV(
    buffer: Buffer,
    expectedHeaders: string[],
  ): Record<string, string>[] {
    let content = buffer.toString('utf-8');

    // Remove BOM (Byte Order Mark) if present
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    const lines = this.splitLines(content);

    if (lines.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // Parse header row
    const headerRow = this.parseLine(lines[0]);
    const headers = headerRow.map((h) => h.trim().toLowerCase());

    // Validate that all expected headers are present
    const missingHeaders = expectedHeaders.filter(
      (eh) => !headers.includes(eh),
    );
    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `Missing required CSV headers: ${missingHeaders.join(', ')}. Expected headers: ${expectedHeaders.join(', ')}`,
      );
    }

    // Parse data rows
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty rows
      if (line === '') {
        continue;
      }

      const values = this.parseLine(line);
      const row: Record<string, string> = {};

      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = (values[j] || '').trim();
      }

      rows.push(row);
    }

    return rows;
  }

  /**
   * Generate a CSV string from data with specified headers.
   * @param data - Array of row objects
   * @param headers - Array of {key, label} for column mapping
   * @returns CSV string with header row and data rows
   */
  generateCSV(
    data: Record<string, any>[],
    headers: { key: string; label: string }[],
  ): string {
    const lines: string[] = [];

    // Header row
    lines.push(headers.map((h) => this.escapeField(h.label)).join(','));

    // Data rows
    for (const row of data) {
      const values = headers.map((h) => {
        const value = row[h.key];
        if (value === null || value === undefined) {
          return '';
        }
        return this.escapeField(String(value));
      });
      lines.push(values.join(','));
    }

    return lines.join('\r\n') + '\r\n';
  }

  /**
   * Split content into lines, handling both \r\n and \n line endings.
   * Respects quoted fields that may contain newlines.
   */
  private splitLines(content: string): string[] {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === '"') {
        // Check for escaped quote (double quote)
        if (inQuotes && i + 1 < content.length && content[i + 1] === '"') {
          current += '""';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
          current += char;
        }
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        // End of line
        if (current.trim() !== '' || lines.length > 0) {
          lines.push(current);
        }
        current = '';
        // Skip \r\n pair
        if (char === '\r' && i + 1 < content.length && content[i + 1] === '\n') {
          i++;
        }
      } else {
        current += char;
      }
    }

    // Add the last line if not empty
    if (current.trim() !== '') {
      lines.push(current);
    }

    return lines;
  }

  /**
   * Parse a single CSV line into an array of field values.
   * Handles quoted fields containing commas and escaped quotes.
   */
  private parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes) {
          // Check for escaped quote (double quote "")
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            // End of quoted field
            inQuotes = false;
          }
        } else {
          // Start of quoted field
          inQuotes = true;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    fields.push(current.trim());

    return fields;
  }

  /**
   * Escape a field value for CSV output.
   * Wraps in quotes if the value contains commas, quotes, or newlines.
   */
  private escapeField(value: string): string {
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r')
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
