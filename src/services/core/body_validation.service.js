const CustomError = require("./custom_error.service");

class BodyValidationService {
  /**
   * Formats a field name for display in error messages by replacing dots with spaces
   * @param {string} fieldName - The field name with possible dot notation
   * @returns {string} - Formatted field name for display
   * @private
   */
  static _formatFieldNameForDisplay(fieldName) {
    return fieldName.replace(/\./g, ' ');
  }

  /**
   * Validates that all required fields are present in the request body
   * @param {Object} body - The request body to validate
   * @param {Array<string|Object>} requiredFields - Array of required field names or objects with field name and custom message
   * @param {string} [errorMessage="Missing required fields"] - Default error message
   * @throws {CustomError} If any required fields are missing
   */
  static validateRequiredFields(body, requiredFields, errorMessage = "Missing required fields") {
    if (!body || typeof body !== 'object') {
      throw new CustomError("Invalid request body", 400);
    }

    const missingFields = [];
    
    for (const field of requiredFields) {
      let fieldName, customMessage;
      
      if (typeof field === 'string') {
        fieldName = field;
        customMessage = null;
      } else if (typeof field === 'object' && field !== null) {
        fieldName = field.name;
        customMessage = field.message;
      } else {
        continue;
      }

      const fieldParts = fieldName.split('.');
      let currentValue = body;
      let isMissing = false;

      for (const part of fieldParts) {
        if (currentValue === undefined || currentValue === null || 
            typeof currentValue !== 'object' || !(part in currentValue)) {
          isMissing = true;
          break;
        }
        currentValue = currentValue[part];
      }

      if (isMissing || currentValue === undefined || currentValue === null || 
          (typeof currentValue === 'string' && currentValue.trim() === '') ||
          (Array.isArray(currentValue) && currentValue.length === 0)) {
        missingFields.push({
          field: fieldName,
          displayName: this._formatFieldNameForDisplay(fieldName),
          message: customMessage || `${this._formatFieldNameForDisplay(fieldName)} is required`
        });
      }
    }

    if (missingFields.length > 0) {
      const detailedMessage = missingFields.map(f => f.message).join(', ');
      throw new CustomError(`${errorMessage}: ${detailedMessage}`, 400, { missingFields });
    }
  }

  /**
   * Validates that all fields in the request body match the expected types
   * @param {Object} body - The request body to validate
   * @param {Object} fieldTypes - Object mapping field names to expected types
   * @throws {CustomError} If any fields have incorrect types
   */
  static validateFieldTypes(body, fieldTypes) {
    if (!body || typeof body !== 'object') {
      throw new CustomError("Invalid request body", 400);
    }

    const typeErrors = [];

    for (const [fieldName, expectedType] of Object.entries(fieldTypes)) {
      if (body[fieldName] !== undefined && body[fieldName] !== null) {
        let isValid = false;
        
        switch (expectedType) {
          case 'string':
            isValid = typeof body[fieldName] === 'string';
            break;
          case 'number':
            isValid = typeof body[fieldName] === 'number' && !isNaN(body[fieldName]);
            break;
          case 'boolean':
            isValid = typeof body[fieldName] === 'boolean';
            break;
          case 'array':
            isValid = Array.isArray(body[fieldName]);
            break;
          case 'object':
            isValid = typeof body[fieldName] === 'object' && !Array.isArray(body[fieldName]) && body[fieldName] !== null;
            break;
          case 'date':
            isValid = !isNaN(new Date(body[fieldName]).getTime());
            break;
          default:
            isValid = true;
        }

        if (!isValid) {
          typeErrors.push({
            field: fieldName,
            displayName: this._formatFieldNameForDisplay(fieldName),
            message: `${this._formatFieldNameForDisplay(fieldName)} must be a valid ${expectedType}`
          });
        }
      }
    }

    if (typeErrors.length > 0) {
      const detailedMessage = typeErrors.map(e => e.message).join(', ');
      throw new CustomError(`Validation error: ${detailedMessage}`, 400, { typeErrors });
    }
  }

  /**
   * Validates that a field meets certain conditions
   * @param {Object} body - The request body to validate
   * @param {string} fieldName - The name of the field to validate
   * @param {Function} validationFn - Function that returns true if validation passes
   * @param {string} errorMessage - Error message to display if validation fails
   * @throws {CustomError} If the validation fails
   */
  static validateCondition(body, fieldName, validationFn, errorMessage) {
    if (body[fieldName] !== undefined && !validationFn(body[fieldName])) {
      throw new CustomError(errorMessage.replace('{field}', this._formatFieldNameForDisplay(fieldName)), 400);
    }
  }
}

module.exports = BodyValidationService;