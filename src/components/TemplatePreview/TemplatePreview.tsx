import { memo, useState, useEffect, useMemo } from 'react';
import classes from './TemplatePreview.module.css'
import { ITemplateNote } from '../TemplateEditing/types';
import AutoResizeInput from '../UI/AutoResizeInput/AutoResizeInput';
import { useDebounce } from '../../hooks/debounce';

interface ITemplatePreview {
    template: ITemplateNote[],
    arrVarNames: string[],
}

function TemplateGenerator(template: ITemplateNote[], values: { [key: string]: string; }): string {
    let result = ''
    console.log(template)
    /*function findAndReplaceValues(str:string){
        for(let key in values) {
            let regex = new RegExp(`{${key}}`,'g');
            str = str.replace(regex,' ' + values[key] + ' ');
        }
        return str
    }
    for(let i = 0; i< template.length; i++) {
        let value = template[i].value;
        if(Array.isArray(value)) {
            let blockId = template[i].id;
            template.find(el=>el.startWhithId == blockId);
            //if()
        } else {
            result += findAndReplaceValues(value)
            result += ' ';
        }
    }*/
    return result
}

const TemplatePreview = ({ template, arrVarNames }: ITemplatePreview) => {
    const [values, setValues] = useState<{ [key: string]: string; }>({});
    useEffect(() => {
        const obj: { [key: string]: string; } = {

        };
        arrVarNames.forEach(el => obj[el] = '')
        setValues(obj)
    }, [arrVarNames])
    const resultMessage = useMemo(()=>{
        return TemplateGenerator(template, values);
    },[template, values])

    const changeStateFunction = useDebounce((str:string, type:string)=>{
        if(type) {
            let obj = {...values};
            obj[type] = str;
            setValues(obj)
        }
    }, 300)
    return (
        <div className={classes.TemplatePreview}>
            <div
                className={classes.resultMessage}
                style={{
                    wordWrap: 'break-word'
                }}
            >{resultMessage}</div>
            {
                arrVarNames.map((v, i) => {
                    return <div
                        key={v + i}>
                        <div className={classes.VariablesWrapTitle}>{'{' + v + '}'}</div>
                        <AutoResizeInput data-type={v} changedFunction={changeStateFunction}/>
                    </div>
                })
            }
        </div>
    );
};

export default memo(TemplatePreview);