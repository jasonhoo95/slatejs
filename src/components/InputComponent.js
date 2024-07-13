import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux";


export default function InputComponent({ inputTxt }) {
    const [value, setValue] = useState();
    const count = useSelector((state) => state.counter.value)

    useEffect(() => {
        setValue(inputTxt)

    }, [inputTxt])

    return (
        <div className="w-full h-[30px] bg-red-500">
            {count}
            <div>
                asd asd ad as
            </div>

        </div>
    )
}