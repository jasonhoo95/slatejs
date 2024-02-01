import { MultiSelect } from "react-multi-select-component";
import { useState } from "react";
const options = [
    { label: "Grapes 🍇", value: "grapes" },
    { label: "Mango 🥭", value: "mango" },
    { label: "Strawberry 🍓", value: "strawberry", disabled: true },
];


export default function MultiSelectComponent({ value }) {
    const [selected, setSelected] = useState(value);

    return (

        <div>
            <h1>Select Fruits</h1>
            <pre>{JSON.stringify(selected)}</pre>
            <MultiSelect
                options={options}
                value={selected}
                onChange={e => {
                    console.log(e)
                    setSelected(e)
                }}
                labelledBy="Select"
            />
        </div>
    )

}