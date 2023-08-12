import { memo, useState, useEffect, useMemo } from 'react';
import classes from './TemplatePreview.module.css'
import { ITemplateNote } from '../TemplateEditing/types';
import AutoResizeInput from '../UI/AutoResizeInput/AutoResizeInput';
import { useDebounce } from '../../hooks/debounce';

interface ITemplatePreview {
    template: ITemplateNote[],
    arrVarNames: string[],
}

function TemplateGenerator(template: ITemplateNote[], values: { [key: string]: string;}, _parentId?:string): string {
    let result = ''
    function findAndReplaceValues(str: string) {
        for (let key in values) {
            let regex = new RegExp(`{${key}}`, 'g');
            str = str.replace(regex, values[key]);
        }
        return str
    }
    for (let i = 0; i < template.length; i++) {
        let value = template[i].value;
        if (Array.isArray(value)) {
            const lastBlockPart = template.findIndex(el => el.startWhithId === template[i].id);
            if (lastBlockPart !== -1) {
                let index = i;
                let ifResult = findAndReplaceValues(value[0] as string)
                if (value[1] === null) {
                    const fieldEnd = template.findIndex(el => el.parentId == template[i].id);
                    index = fieldEnd + 1
                    const ifBlock = template.slice(i+1, fieldEnd + 1) //По fieldEnd включительно;
                    ifResult += TemplateGenerator(ifBlock, values, template[i].id);
                    console.log(ifResult)
                } else {ifResult =  findAndReplaceValues(value[0] as string);}

                if (ifResult) {
                    const fieldEnd = template.findIndex(el => el.parentId == template[index].id);
                    if(fieldEnd !== -1) {
                        let thenResult = findAndReplaceValues(template[index].value[1] as string);
                        const thenBlock = template.slice(index + 1, fieldEnd + 1) //По fieldEnd включительно
                        thenResult += TemplateGenerator(thenBlock, values, template[index].id);
                        index = fieldEnd + 1
                        result += thenResult;
                    } else {result += findAndReplaceValues(template[index].value[1] as string);}
                } else {
                    const fieldEnd = template.findIndex(el => el.parentId == template[index].id);
                    if(fieldEnd !== -1) {
                        let elseResult = findAndReplaceValues(template[index].value[2] as string);
                        const elseBlock = template.slice(index + 1, fieldEnd + 1) //По fieldEnd включительно
                        elseResult += TemplateGenerator(elseBlock, values, template[index].id);
                        result += elseResult;
                    } else {result += findAndReplaceValues(template[index].value[2] as string);}
                }
                i = lastBlockPart;
            } else {
                const ifResult = findAndReplaceValues(value[0] || '');
                if (ifResult) {
                    result += findAndReplaceValues(value[1] || '');
                } else {
                    result += findAndReplaceValues(value[2] || '');
                }
            }
        } else {
            if (!template[i].parentId || template[i].parentId === _parentId) {
                result +=  findAndReplaceValues(value);
            }
        }
    }
    return result
}

const TemplatePreview = ({ template, arrVarNames }: ITemplatePreview) => {
    const [values, setValues] = useState<{ [key: string]: string; }>({});
    useEffect(() => {
        const obj: { [key: string]: string; } = {};
        arrVarNames.forEach(el => obj[el] = '')
        setValues(obj)
    }, [arrVarNames])
    const resultMessage = useMemo(() => {
        return TemplateGenerator(template, values);
    }, [template, values])

    const changeStateFunction = useDebounce((str: string, type: string) => {
        if (type) {
            let obj = { ...values };
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
                        <AutoResizeInput data-type={v} changedFunction={changeStateFunction} />
                    </div>
                })
            }
        </div>
    );
};

export default memo(TemplatePreview);