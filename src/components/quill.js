import React, { useEffect, useRef, useState } from 'react';
import Editor from './Editor';


const QuillComponent = () => {
    useEffect(() => {
        const quill = new Quill('#editor', {
            theme: 'snow'
        });

    }, [])

    return (
        <div id="editor">
            <h2>Demo Content</h2>
            <p>Preset build with <code>snow</code> theme, and some common formats.</p>
        </div>
    )
};

export default QuillComponent;