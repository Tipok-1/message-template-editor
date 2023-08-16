import { memo, useState, useEffect, useMemo } from 'react';
import classes from './TemplatePreview.module.css'
import { ITemplateNote } from '../TemplateEditing/types';
import AutoResizeInput from '../UI/AutoResizeInput/AutoResizeInput';
import { useDebounce } from '../../hooks/debounce';

interface ITemplatePreview {
    template: ITemplateNote[],
    arrVarNames: string[],
}

export function TemplateGenerator(template: ITemplateNote[], values: { [key: string]: string; }, _parentId?: string): string {
    let result = ''
    function findLastIndex<T>(arr: Array<T>, fn: (value: T, index: number, obj: T[]) => boolean) {
        let l = arr.length;
        while (l--) {
            if (fn(arr[l], l, arr))
                return l;
        }
        return -1;
    }
    function findAndReplaceValues(str: string) {
        if (str !== null) {
            let regespStr = ''
            for (let key in values) {
                regespStr += `{${key}}` + '|';
            }
            regespStr = regespStr.slice(0, regespStr.length - 1);
            let regex = new RegExp(regespStr, 'g'); //Составляем регулярное выражение из ключей values
            let result:IterableIterator<RegExpMatchArray> = str.matchAll(regex)//Получаем все совпадения
            let resultArray = Array.from(result);
            let resultString = '';
            let prevIndex = 0;//Индекс после предыдущей замены
            for(let coincidence of resultArray ) {
                let index = coincidence.index;
                let key = coincidence['0'].slice(1, coincidence['0'].length - 1);
                let wordLength = coincidence['0'].length;
                if(values.hasOwnProperty(key)) {
                    resultString += str.slice(prevIndex, index);//Прибавляем к результату строку до совпадения
                    resultString += values[key];//Прибавляем к результату совпадение
                    prevIndex = (index || 0) + wordLength;//Делаем предыдущий индекс сразу после совпадения
                }
            }
            resultString += str.slice(prevIndex, str.length);//Прибавляем к результату строку после всех совпадений
            return resultString;
        } else {//Не должно выполняться при коректной работе
            return ''
        }
    }
    for (let i = 0; i < template.length; i++) {
        let value = template[i].value;
        if (Array.isArray(value)) {
            const lastBlockPart = template.findIndex(el => el.startWhithId === template[i].id); //Ищем конец [if-then-else] блока
            if (lastBlockPart !== -1) {//Если блок составной
                let index = i;
                let ifResult = findAndReplaceValues(value[0] as string)//Включаем первую строку if
                if (value[1] === null) {//Если блок if составной
                    // const fieldEnd = template.findLastIndex(el => el.parentId === template[i].id);
                    const fieldEnd = findLastIndex(template, el => el.parentId === template[i].id);//Ищем последнюю часть блока if
                    const ifBlock = template.slice(i + 1, fieldEnd + 1);//(Первую строку if мы уже включили)
                    ifResult += TemplateGenerator(ifBlock, values, template[i].id);
                    index = fieldEnd + 1
                }
                if (ifResult) {
                    //const fieldEnd = template.findLastIndex(el => el.parentId == template[index].id);
                    const fieldEnd = findLastIndex(template, el => el.parentId === template[index].id);//Проверяем составной ли блок then
                    let thenResult = findAndReplaceValues(template[index].value[1] as string);
                    if (fieldEnd !== -1 && value[2] === null) {
                        const thenBlock = template.slice(index + 1, fieldEnd + 1) //(Первую строку then мы уже включили)
                        thenResult += TemplateGenerator(thenBlock, values, template[index].id);
                        index = fieldEnd + 1//Следующий блок берём после блока then
                    }
                    result += thenResult;
                } else {
                    if (template[index].value[2] === null) {//template[index] - это блок then который может быт составным - если value[2] === null
                        //const thenFieldEnd = template.findLastIndex(el => el.parentId == template[index].id);
                        const thenFieldEnd = findLastIndex(template, el => el.parentId === template[index].id)
                        if (thenFieldEnd !== -1) {
                            index = thenFieldEnd + 1;
                        }
                    }
                    //const fieldEnd = template.findLastIndex(el => el.parentId == template[index].id);
                    const fieldEnd = findLastIndex(template, el => el.parentId === template[index].id);//Проверяем составной ли блок else
                    let elseResult = findAndReplaceValues(template[index].value[2] as string);
                    if (fieldEnd !== -1) {
                        const elseBlock = template.slice(index + 1, fieldEnd + 1)//(Первую строку else мы уже включили)
                        elseResult += TemplateGenerator(elseBlock, values, template[index].id);
                    }
                    result += elseResult;
                }
                i = lastBlockPart;
            } else {
                //Если блок [if-then-else] не составной - просто считываем поля
                const ifResult = findAndReplaceValues(value[0] || '');
                if (ifResult) {
                    result += findAndReplaceValues(value[1] || '');
                } else {
                    result += findAndReplaceValues(value[2] || '');
                }
            }
        } else {
            if (!template[i].parentId || template[i].parentId === _parentId) {
                result += findAndReplaceValues(value);
            }
        }
    }
    return result
}

const TemplatePreview = ({ template, arrVarNames }: ITemplatePreview) => {
    const [values, setValues] = useState<{ [key: string]: string; }>({});//Состояние хранящее значения переменных (объект вида {name : value})
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
    }, 300)//Задаём промежуток времени спустя которое, после остановки ввода в textfield, будет вызываться callback
    return (
        <div className={classes.TemplatePreview}>
            <div
                className={classes.resultMessage}
                style={{
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
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