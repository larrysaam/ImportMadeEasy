// Update the FileUpload component to properly handle reset
// This is a partial update - you'll need to locate this section in your component
useEffect(() => {
  // Reset the fileList when value changes to empty array
  if (Array.isArray(value) && value.length === 0 && fileList.length > 0) {
    setFileList([]);
  }
}, [value, fileList.length]);
