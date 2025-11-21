import React, { useState } from 'react';
import { LuUpload, LuX, LuCheck, LuInfo, LuFileText, LuDatabase } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const UploadJoinersPopup = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: JSON Input, 2: Validation, 3: Upload
  const [jsonData, setJsonData] = useState({});
  
  // Get the Google Sheet URL from environment variable
  // Note: Vite only loads env vars at build/start time - restart dev server after .env changes
  const googleSheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL || '';

  const [joinersData, setJoinersData] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [dataFromSheets, setDataFromSheets] = useState(false); // Track if data came from sheets

  const handleJsonChange = (e) => {
    const value = e.target.value.trim();
    
    if (value === '') {
      setJsonData({});
      setErrors([]);
      return;
    }
    
    try {
      const parsed = JSON.parse(value);
      setJsonData(parsed);
      setErrors([]);
    } catch (error) {
      setErrors(['Invalid JSON format']);
    }
  };

  const handleValidateSheets = async () => {
    // Google Sheet URL is now optional

    if (Object.keys(jsonData).length === 0) {
      setErrors(['Please provide JSON configuration']);
      return;
    }
    
    if (!jsonData.spread_sheet_name || !jsonData.data_sets_to_be_loaded) {
      setErrors(['Please provide valid JSON configuration with spread_sheet_name and data_sets_to_be_loaded']);
      return;
    }

    // Debug: Log the Google Sheet URL

    // Google Sheet URL is optional - if not provided, will work in direct mode
    // No need to block if googleSheetUrl is missing - backend supports direct mode

    setLoading(true);
    setErrors([]);

    try {
      const requestPayload = {
        spread_sheet_name: jsonData.spread_sheet_name,
        data_sets_to_be_loaded: jsonData.data_sets_to_be_loaded,
        google_sheet_url: googleSheetUrl || null // Use null if not available
      };

      // Debug: Log the request payload
      console.log('Validating sheets with:', {
        spread_sheet_name: requestPayload.spread_sheet_name,
        data_sets_to_be_loaded: requestPayload.data_sets_to_be_loaded,
        has_google_sheet_url: !!requestPayload.google_sheet_url,
        google_sheet_url: requestPayload.google_sheet_url ? `${requestPayload.google_sheet_url.substring(0, 50)}...` : 'null'
      });

      const response = await axiosInstance.post(API_PATHS.JOINERS.VALIDATE_SHEETS, requestPayload);

      // Debug: Log the response structure
      console.log('Validation response:', response.data);
      console.log('Response data structure:', {
        hasResponseData: !!response.data,
        hasData: !!response.data?.data,
        sheetDataType: typeof response.data?.data,
        isSheetDataArray: Array.isArray(response.data?.data),
        sheetDataKeys: response.data?.data && typeof response.data.data === 'object' ? Object.keys(response.data.data) : null,
        sheetDataDataLength: response.data?.data?.data?.length,
        sheetDataDataType: typeof response.data?.data?.data
      });

      setValidationResult(response.data);
      
      // Extract data from Google Sheets response
      // Response structure: { message: '...', data: sheetData }
      // sheetData structure: { spread_sheet_name: '...', data_sets_to_be_loaded: [...], data: [...] }
      let extractedData = null;
      
      if (response.data && response.data.data) {
        const sheetData = response.data.data;
        
        console.log('Sheet data structure:', {
          type: typeof sheetData,
          isArray: Array.isArray(sheetData),
          keys: typeof sheetData === 'object' && sheetData !== null ? Object.keys(sheetData) : null,
          hasDataProperty: !!sheetData.data,
          dataLength: sheetData.data?.length
        });
        
        // Check if sheetData has a data property (array of joiners)
        if (sheetData.data && Array.isArray(sheetData.data) && sheetData.data.length > 0) {
          extractedData = sheetData.data;
          console.log(`Extracted ${extractedData.length} records from sheetData.data`);
        }
        // Also check if sheetData itself is an array (alternative structure)
        else if (Array.isArray(sheetData) && sheetData.length > 0) {
          extractedData = sheetData;
          console.log(`Extracted ${extractedData.length} records from sheetData (direct array)`);
        } else {
          console.warn('No data found in sheetData. Structure:', sheetData);
        }
      } else {
        console.warn('No response.data or response.data.data found');
      }
      
      if (extractedData && extractedData.length > 0) {
        // Debug: Log first record to see the data structure
        if (extractedData[0]) {
          console.log('First extracted record:', JSON.stringify(extractedData[0], null, 2));
          console.log('First record phone_number:', extractedData[0].phone_number);
          console.log('First record keys:', Object.keys(extractedData[0]));
        }
        
        setJoinersData(extractedData);
        setDataFromSheets(true); // Mark that data came from sheets
        toast.success(`Data fetched from Google Sheets successfully! Found ${extractedData.length} records.`);
      } else {
        // In direct mode, show message that user can add data manually
        toast.success('Configuration validated! You can now add joiners data manually.');
        // Clear any existing dummy data
        setJoinersData([]);
        setDataFromSheets(false); // Mark that data didn't come from sheets
      }
      
      setStep(2);
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to validate Google Sheets';
      setErrors([errorMessage]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadData = async () => {
    if (!joinersData.length) {
      setErrors(['No joiners data provided']);
      return;
    }

    // Google Sheet URL is optional - if not provided, will work in direct mode
    if (!googleSheetUrl) {
    }

    setLoading(true);
    setErrors([]);

    try {
      // Set a longer timeout for bulk uploads (5 minutes)
      const response = await axiosInstance.post(API_PATHS.JOINERS.BULK_UPLOAD, {
        spread_sheet_name: jsonData.spread_sheet_name,
        data_sets_to_be_loaded: jsonData.data_sets_to_be_loaded,
        google_sheet_url: googleSheetUrl || null, // Use null if not available
        joiners_data: joinersData
      }, {
        timeout: 300000 // 5 minutes timeout
      });

      if (response.data.createdCount !== undefined) {
        toast.success(`Successfully uploaded ${response.data.createdCount} joiners!`);
        onSuccess?.(response.data);
        handleClose();
      } else {
        // Handle partial success or warnings
        const message = response.data.message || 'Upload completed with warnings';
        toast.success(message);
        if (response.data.errors && response.data.errors.length > 0) {
          setErrors(response.data.errors);
        } else {
          onSuccess?.(response.data);
          handleClose();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Failed to upload joiners data';
      const errorDetails = error.response?.data?.errors || [];
      const errorStack = error.response?.data?.stack;
      
      // Build comprehensive error list
      const allErrors = [errorMessage];
      if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
        allErrors.push(...errorDetails);
      } else if (typeof errorDetails === 'string') {
        allErrors.push(errorDetails);
      }
      
      // Add server error details if available
      if (error.response?.data?.error) {
        allErrors.push(`Server error: ${error.response.data.error}`);
      }
      
      // Add database error details if available
      if (error.response?.data?.errorName) {
        allErrors.push(`Error type: ${error.response.data.errorName}`);
      }
      
      if (error.response?.data?.errorCount !== undefined) {
        allErrors.push(`Failed records: ${error.response.data.errorCount} out of ${error.response.data.totalCount || 'unknown'}`);
      }
      
      setErrors(allErrors);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinersDataChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      if (Array.isArray(parsed)) {
        setJoinersData(parsed);
        setErrors([]);
      } else {
        setErrors(['Joiners data must be an array']);
      }
    } catch (error) {
      setErrors(['Invalid JSON format for joiners data']);
    }
  };

  const handleClose = () => {
    setStep(1);
    setJsonData({});
    setJoinersData([]);
    setValidationResult(null);
    setDataFromSheets(false);
    setErrors([]);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: JSON Configuration</h3>
        
        <div className="space-y-4">
          {/* Google Sheet URL is loaded from .env file automatically */}
          {!googleSheetUrl && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <LuInfo className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Google Sheet URL not configured</p>
                  <p className="mt-1">To fetch data from Google Sheets, configure <code className="bg-yellow-100 px-1 rounded">VITE_GOOGLE_SHEET_URL</code> in your <code className="bg-yellow-100 px-1 rounded">.env</code> file and restart the dev server.</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON Configuration
            </label>
            <textarea
              value={Object.keys(jsonData).length === 0 ? '' : JSON.stringify(jsonData, null, 2)}
              onChange={handleJsonChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder='{
  "spread_sheet_name": "Your_Spreadsheet_Name",
  "data_sets_to_be_loaded": ["Your_Dataset_Name"]
}'
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your spreadsheet configuration in JSON format. Google Sheet URL is automatically configured from environment settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Add Joiners Data</h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <LuCheck className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              {joinersData.length > 0 ? 'Data loaded from Google Sheets!' : 'Configuration validated successfully!'}
            </span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            {joinersData.length > 0 
              ? `Found ${joinersData.length} records from your Google Sheet. Review and upload the data.`
              : 'Spreadsheet name and datasets match. You can now add your joiners data.'
            }
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Joiners Data (JSON Array)
          </label>
          <p className="text-sm text-gray-600 mb-3">
            {joinersData.length > 0 
              ? `Found ${joinersData.length} records from Google Sheets. Review the data below.`
              : 'Add your joiners data in JSON format. Each object should contain the required fields.'
            }
          </p>
          <textarea
            value={joinersData.length > 0 ? JSON.stringify(joinersData, null, 2) : ''}
            onChange={handleJoinersDataChange}
            rows={12}
            readOnly={joinersData.length > 0 && dataFromSheets}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
              joinersData.length > 0 && dataFromSheets
                ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                : joinersData.length === 0 
                  ? 'border-blue-300 bg-blue-50' 
                  : ''
            }`}
            placeholder='[
  {
    "date_of_joining": "2024-01-15",
    "candidate_name": "John Doe",
    "phone_number": "+1234567890",
    "candidate_personal_mail_id": "john@example.com",
    "top_department_name_as_per_darwinbox": "IT",
    "joining_status": "confirmed",
    "role_assign": "SDM",
    "employee_id": "EMP001",
    "genre": "Male",
    "status": "pending",
    "onboardingChecklist": {
      "welcomeEmailSent": false,
      "credentialsGenerated": false,
      "accountActivated": false,
      "trainingAssigned": false,
      "documentsSubmitted": false
    }
  }
]'
          />
          <p className="text-xs text-gray-500 mt-1">
            {joinersData.length > 0 && validationResult?.data?.data?.length > 0 
              ? 'Data loaded from Google Sheets. Review the data and click "Upload Data" to save to database.'
              : 'Enter an array of joiner objects with the required fields. Replace the placeholder with your actual data.'
            }
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Upload Summary</h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <LuDatabase className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Ready to Upload</span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Spreadsheet:</strong> {jsonData.spread_sheet_name}</p>
            <p><strong>Datasets:</strong> {jsonData.data_sets_to_be_loaded.join(', ')}</p>
            <p><strong>Joiners Count:</strong> {joinersData.length}</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <LuInfo className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important Notes:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Author ID will be generated automatically for each joiner</li>
                <li>Missing fields will be set to null</li>
                <li>Duplicate emails will be rejected</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={handleClose}
      />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LuUpload className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload New Joiners Data</h2>
              <p className="text-sm text-gray-600">Bulk upload joiners from Google Sheets</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Verify</span>
            </div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Data</span>
            </div>
            <div className={`flex-1 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <LuInfo className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Validation Errors:</h4>
                  <ul className="mt-1 text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="list-disc list-inside">{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            
            {step === 1 && (
              <button
                onClick={handleValidateSheets}
                disabled={loading || !jsonData.spread_sheet_name || !jsonData.data_sets_to_be_loaded}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Validating...' : 'Validate Sheets'}
              </button>
            )}
            
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!joinersData.length}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Review Upload
              </button>
            )}
            
            {step === 3 && (
              <button
                onClick={handleUploadData}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Uploading...' : 'Upload Data'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadJoinersPopup;
