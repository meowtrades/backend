import { OpenAIBatchOutput } from '../types';

export class OpenAIOutputTransformer<T> {
  /**
   *
   * @param data The data to transform
   *
   * Extracts content from the OpenAI batch output and returns it in a format that can be used by the application.
   */
  transform(rawData: string): T[] {
    const data = OpenAIOutputTransformer.convertJsonlToJsonArray(rawData) as OpenAIBatchOutput[];

    if (data.length === 0) {
      throw new Error('No valid data found in the input');
    }

    return data.map(item => {
      const {
        message: { content },
      } = item.response.body.choices[0];
      const parsedContent = JSON.parse(content) as T;
      return {
        ...parsedContent,
      };
    });
  }

  /**
   * Converts a JSONL string into a JSON array.
   * Handles cases where the content field contains newline characters.
   *
   * @param jsonlString The JSONL string to convert
   * @returns An array of JSON objects
   */
  static convertJsonlToJsonArray(jsonlString: string): any[] {
    const lines = jsonlString.split('\n');
    const jsonArray = [];
    let buffer = '';

    for (const line of lines) {
      if (line.trim() === '') continue;

      buffer += line;

      try {
        const parsed = JSON.parse(buffer);
        jsonArray.push(parsed);
        buffer = ''; // Clear the buffer after successful parsing
      } catch {
        // If parsing fails, continue accumulating lines in the buffer
        continue;
      }
    }

    if (buffer.trim() !== '') {
      throw new Error('Invalid JSONL format: Unfinished JSON object in the input');
    }

    return jsonArray;
  }
}
