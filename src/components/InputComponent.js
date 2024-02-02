import { useEffect, useState } from "react"


export default function InputComponent({ inputTxt }) {
    const [value, setValue] = useState();

    useEffect(() => {
        setValue(inputTxt)

    }, [inputTxt])

    return (
        <div className="w-full h-[30px]">
            <input value={value} onChange={e => {
                setValue(e.target.value)
            }} className="w-full h-full" type="text"></input>

        </div>
    )
}