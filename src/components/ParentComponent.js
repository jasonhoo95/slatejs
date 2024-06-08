import React, { useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { decrement, incrementByAmount } from '@/globals/counterSlice'
import InputComponent from './InputComponent';
const ChildrenComponent = ({ value, onInputChange }) => {
  const handleInputChange = (e) => {
    const newInputTxt = e.target.value;
    onInputChange((prevValue) => ({ ...prevValue, inputTxt: newInputTxt }));
  };

  return (
    <div className="w-full h-[30px]">
      <InputComponent />
      <input className="w-full h-full" type="text" value={value.inputTxt} onChange={handleInputChange} />
    </div>
  );
};

const ParentComponent = () => {
  const [value, setValue] = useState({ id: 1, inputTxt: 'ok', select: [1, 2, 3] });
  const dispatch = useDispatch()

  const handleInputChange = (newValue) => {

    setValue(newValue);
  };

  return (
    <div>
      <button onClick={e => {
        dispatch(incrementByAmount())

      }}>click me</button>
      <ChildrenComponent value={value} onInputChange={handleInputChange} />
      <p>Parent Component Value: {value.inputTxt}</p>
    </div>
  );
};

export default ParentComponent