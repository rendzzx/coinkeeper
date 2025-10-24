import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import type { HistoryLog } from './types';
import packageInfo from '../../package.json';

/**
 * Serializes a value to a JSON-safe format, handling potential circular references.
 * @param value The value to serialize.
 * @returns A JSON-serializable representation of the value.
 */
function makeJsonSafe(value: any): any {
    if (value === undefined || value === null || typeof value !== 'object') {
        return value;
    }

    try {
        // A simple way to check for circular references is to try and stringify it.
        // For more complex objects, a more robust solution might be needed.
        JSON.stringify(value);
        return value;
    } catch (error) {
        // If stringify fails, it's likely a circular reference or a complex object.
        // We can return a string representation as a fallback.
        console.warn("Could not serialize object for history log, falling back to string:", error);
        return '[Circular/Complex Object]';
    }
}

/**
 * Creates and saves a history log entry to the database.
 * @param entry A partial HistoryLog object containing the details to log.
 * @returns The full, saved HistoryLog object.
 */
export async function logHistory(entry: Partial<HistoryLog>): Promise<HistoryLog> {
    const fullLogEntry: HistoryLog = {
        // Default values
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        action: 'system', // default action
        entity: 'other', // default entity
        status: 'success',
        version: packageInfo.version || 'dev',

        // Provided entry values
        ...entry,

        // Sanitize object fields
        oldValue: entry.oldValue ? makeJsonSafe(entry.oldValue) : null,
        newValue: entry.newValue ? makeJsonSafe(entry.newValue) : null,
    };

    try {
        await db.history.add(fullLogEntry);
        return fullLogEntry;
    } catch (error) {
        console.error("Failed to log history:", error);
        // Optionally, re-throw or handle the error as needed
        throw error;
    }
}
