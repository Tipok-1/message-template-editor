import { memo } from 'react';
import classes from './IfThenElse.module.css'
import AutoResizeInput from '../UI/AutoResizeInput/AutoResizeInput';
import { IoClose } from "react-icons/io5";
import { ITemplateNote } from '../TemplateEditing/types';

interface IIfThenElse {
    fieldState: ITemplateNote,
    Blur: (val: string, id: string,cursorPosition:number, fieldNumber?: number) => void,
    setLastActiveIfThenElseField: React.Dispatch<React.SetStateAction<number>>
    deleteIfThenElseBlock: (id:string)=>void
}
const IfThenElse = ({ fieldState, Blur, setLastActiveIfThenElseField, deleteIfThenElseBlock}: IIfThenElse) => {
    function onBlur(e: React.FocusEvent<HTMLTextAreaElement, Element>, fieldNumber: number) {
        setLastActiveIfThenElseField(fieldNumber);
        console.log(fieldNumber)
        Blur(e.currentTarget.value, fieldState.id,e.currentTarget.selectionStart ,fieldNumber);
    }
    return (
        <div
            className={classes.IfThenElse}
            style={{ height: 'auto', marginLeft: fieldState.nesting ? `${fieldState.nesting * 7}%` : '' }/*7% ширина кнопки close умножаем на вложенность */}>
            {(fieldState.value.length > 0 && fieldState.value[0] != null) &&
                <div className={classes.closeButtonWrap}>
                    <div onClick={()=>deleteIfThenElseBlock(fieldState.id)} className={classes.closeButton}>
                        < IoClose color="white" className={classes.CloseIco} />
                    </div>
                    <div></div>
                </div>
            }
            <div className={classes.IfThenElseWrap} style={{ marginLeft: fieldState.value[0] != null ? '' : '7%' }}>
                {(fieldState.value.length > 0 && fieldState.value[0] != null) &&
                    <div className={classes.TextFieldWrap}>
                        <div className={classes.Tooltip}>IF</div  >
                        <AutoResizeInput
                            className={classes.TextField}
                            onBlur={e => onBlur(e, 0)}
                            textWhithVariables={fieldState.value[0]}
                        />
                    </div>
                }
                {(fieldState.value.length > 1 && fieldState.value[1] != null) &&
                    <div
                        style={{
                            marginTop: fieldState.value[0] != null ? '35px' : '0'
                        }}
                        className={classes.TextFieldWrap}>
                        <div className={classes.Tooltip}>THEN</div  >
                        <AutoResizeInput
                            className={classes.TextField}
                            onBlur={e => onBlur(e, 1)}
                            textWhithVariables={fieldState.value[1]}
                        />
                    </div>
                }
                {(fieldState.value.length > 2 && fieldState.value[2] != null) &&
                    <div
                        style={{
                            marginTop: fieldState.value[1] != null ? '35px' : '0'
                        }}
                        className={classes.TextFieldWrap}>
                        <div className={classes.Tooltip}>ELSE</div  >
                        <AutoResizeInput
                            className={classes.TextField}
                            onBlur={e => onBlur(e, 2)}
                            textWhithVariables={fieldState.value[2]}
                        />
                    </div>
                }
            </div>
        </div>
    );
};

export default memo(IfThenElse);