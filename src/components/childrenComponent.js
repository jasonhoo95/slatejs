import { useEffect, useState } from "react"
import InputComponent from "./inputComponent"

export default function ChildrenComponent({value, onChange}){

 

    return(
        <div className="w-full h-[30px]">
      <InputComponent value={value} onChange={onChange}/>
        </div>
    )
}