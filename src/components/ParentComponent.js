import React, { useState } from 'react';

const ChildrenComponent = ({ value, onInputChange }) => {
  const handleInputChange = (e) => {
    const newInputTxt = e.target.value;
    onInputChange((prevValue) => ({ ...prevValue, inputTxt: newInputTxt }));
  };

  return (
    <div className="w-full h-[30px]">
      <input className="w-full h-full" type="text" value={value.inputTxt} onChange={handleInputChange} />
    </div>
  );
};

const ParentComponent = () => {
  const [value, setValue] = useState({ id: 1, inputTxt: 'ok', select: [1, 2, 3] });

  const handleInputChange = (newValue) => {
    setValue(newValue);
  };

  return (
    <div>
      <ChildrenComponent value={value} onInputChange={handleInputChange} />
      <p>Parent Component Value: {value.inputTxt}</p>
    </div>
  );
};

export default ParentComponent