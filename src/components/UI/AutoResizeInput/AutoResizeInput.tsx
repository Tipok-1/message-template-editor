import { useState, useEffect, useRef, TextareaHTMLAttributes, memo } from 'react';
import classes from './AutoResizeInput.module.css'
interface IAutoResizeInput {
    textWhithVariables?:string
    changedFunction?:(str:string, type?:string)=>void
}
const AutoResizeInput = ({textWhithVariables,changedFunction, className, ...props}:TextareaHTMLAttributes<HTMLTextAreaElement> & IAutoResizeInput) => {
    //ButtonHTMLAttributes
    const [text, setText] = useState('');
    const textAreaRef = useRef<null | HTMLTextAreaElement>(null);

    const resizeTextArea = () => {
        if(textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
        }
    };
    function onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
        if(changedFunction) {
            changedFunction(e.target.value, e.target.dataset.type);
        }
        setText(e.target.value)
    }

    useEffect(resizeTextArea, [text]);
    useEffect(()=>setText(textWhithVariables || ''), [textWhithVariables]);
    return (
        <textarea
            ref={textAreaRef}
            className={classes.AutoResizeInput  + ' ' + (className ? className : '')}
            value={text}
            onChange={e => onInput(e)}
            rows={1}
            {...props}
        >

        </textarea>
    );
};

export default memo(AutoResizeInput);