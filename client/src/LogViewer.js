import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LogViewer = () => {
  const [logs, setLogs] = useState('');
  const [visible, setVisible] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/logs`);
      setLogs(response.data.logs); // Assuming the response data contains a 'logs' key with the log content as string
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs('Error fetching logs');
    }
  };

  useEffect(() => {
    if (visible) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000); // Fetch logs every 5 seconds
      return () => clearInterval(interval);
    }
  }, [visible]);

  return (
    <div className="log-viewer">
      <label>
        <input
          type="checkbox"
          checked={visible}
          onChange={() => setVisible(!visible)}
        />
        Show Logs
      </label>
      {visible && (
        <pre className="log-content">
          {typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default LogViewer;
