import { useState, useCallback, memo, useEffect } from 'react';
import classes from './TemplateEditing.module.css'
import Button from '../UI/Button/Button';
import AutoResizeInput from '../UI/AutoResizeInput/AutoResizeInput';
import { IcoType } from '../UI/Button/Button';
import IfThenElse from '../IfThenElse/IfThenElse';
import { createId } from '../../Services/GeneralService';
import TemplatePreview from '../TemplatePreview/TemplatePreview';
import { GrClose } from "react-icons/gr";
import { ITemplateEditing, ITemplateEditingButtons, ITemplateNote } from './types';
import { findLastIndex } from '../TemplatePreview/TemplatePreview';

const TemplateEditingButtons = memo(({ previewCallback, saveCallback, closeCallback }: ITemplateEditingButtons) => {
    return (
        <div className={classes.buttonsWrap}>
            <div className={classes.buttonsCenterWrap}>
                <Button onClick={previewCallback} ico={IcoType.preview}>Preview</Button>
                <Button ico={IcoType.save} onClick={saveCallback}>Save</Button>
                <Button ico={IcoType.close} onClick={closeCallback}>Close</Button>
            </div>
        </div>
    )
})
const TemplateEditing = ({ arrVarNames, template, callbackSave, _closeCallback }: ITemplateEditing) => {
    const [previewMessageShift, setPreviewMessageShift] = useState(102);//Состояние для контроля отображения preview
    const [lastActiveElement, setLastActiveElement] = useState<string>(template ? template[0].id : createId());
    //Состояние хранящее id последнего активного элемента
    const [lastCursorPosition, setLastCursorPosition] = useState<number>(0);//Состояние хранящее последнюю позицию курсора в активном элементе
    const [lastActiveIfThenElseField, setLastActiveIfThenElseField] = useState<number>(0);//Состояние хранящее номер активного поля в блоке [if-then-else]
    const [templ, setTempl] = useState<ITemplateNote[]>(template || [{ id: lastActiveElement, value: '' }])//Состояние хранящее шаблон
    const [infoMessage, setInfoMessage] = useState('')//Состояние хранящее информационное сообщение

    const Blur = useCallback(function BlurFN(val: string, id: string, cursorPosition: number, fieldNumber?: number) {
        //Обновляем state только после потери фокуса
        setTempl(prev => prev.map(el => {
            if (el.id !== id) {
                return el
            } else {
                if (!Array.isArray(el.value)) {
                    const obj: ITemplateNote = { id: el.id, value: val }
                    if (el.nesting != undefined) obj.nesting = el.nesting
                    if (el.startWhithId) obj.startWhithId = el.startWhithId
                    if (el.parentId) obj.parentId = el.parentId
                    return obj;
                }
                else {
                    const obj: ITemplateNote = { id: el.id, value: el.value.map((arrEl, i) => i == fieldNumber ? val : arrEl) }
                    if (el.nesting != undefined) obj.nesting = el.nesting
                    if (el.startWhithId) obj.startWhithId = el.startWhithId
                    if (el.parentId) obj.parentId = el.parentId
                    return obj;
                }
            }
        }));
        setLastCursorPosition(cursorPosition)
        setLastActiveElement(id);
    }, [])
    function clickVariables(variables: string) {
        //Добавляем переменную в последний активный textfield
        if (lastActiveElement) {
            setTempl(prev => prev.map(el => {
                if (el.id != lastActiveElement) {
                    return el
                } else {
                    if (!Array.isArray(el.value)) {
                        const obj: ITemplateNote = {
                            id: el.id,
                            value: el.value.slice(0, lastCursorPosition) + `{${variables}}` + el.value.slice(lastCursorPosition)
                        }
                        if (el.nesting != undefined) obj.nesting = el.nesting
                        if (el.startWhithId) obj.startWhithId = el.startWhithId
                        if (el.parentId) obj.parentId = el.parentId
                        return obj;
                    }
                    else {
                        const obj: ITemplateNote = {
                            id: el.id,
                            value: el.value.map((arrEl, i) => i == lastActiveIfThenElseField ?
                                (arrEl !== null) ? arrEl.slice(0, lastCursorPosition) + `{${variables}}` + arrEl.slice(lastCursorPosition) : arrEl
                                : arrEl),//Если переменная блок [if-then-else] - добавляем переменную в нужное поле
                        }
                        if (el.nesting != undefined) obj.nesting = el.nesting
                        if (el.startWhithId) obj.startWhithId = el.startWhithId
                        if (el.parentId) obj.parentId = el.parentId
                        return obj;
                    }
                }
            }));
        }
    }
    const deleteIfThenElseBlock = useCallback((id: string) => {
        let block: ITemplateNote | undefined = templ.find(el => el.id == id)
        let blockId = templ.findIndex(el => el.id == id)
        const prevBlock = templ[blockId - 1];
        let nextBlock = templ[blockId + 2];
        let inputText = '';//Текст последнего удаляемого инпута
        if (block) {
            let newTempl = null;
            let blockEnd = templ.findIndex(el => el.startWhithId === block!.id)
            if (blockEnd !== -1) {
                //Блок составной
                nextBlock = templ[blockEnd + 2]; // Получаем следующий блок который идёт за текущим
                newTempl = templ.filter((el, i) => {
                    if (i >= blockId && i <= blockEnd + 1) {//Удаляем сам  блок и следующий за ним input
                        if (i === blockEnd + 1) {
                            inputText += el.value;
                        }
                        return false
                    }
                    return true;
                });
            } else {
                //Блок не составной
                newTempl = templ.filter((el, i) => {
                    if (el.id === block!.id || i === blockId + 1) {//Удаляем сам  блок и следующий за ним input
                        if (i === blockId + 1) {
                            inputText += el.value;
                        }
                        return false
                    }
                    return true
                });
            }
            if (!Array.isArray(prevBlock.value)) {
                prevBlock.value += inputText; //Добавляем inputText к предыдущему блоку
            } else {
                let ind = findLastIndex(prevBlock.value, el => el !== null);
                if (ind !== -1) {
                    prevBlock.value = prevBlock.value.map((el, i) => i === ind ? el + inputText : el);//Добавляем inputText к предыдущему блоку
                }
            }
            if (Array.isArray(prevBlock.value) && Array.isArray(nextBlock.value) && !nextBlock.parentId) {
                //Если предыдущий и последующий блоки это массивы, надо обьединить их в один блок с обобщённой информацией
                let coupledBlock: string[] = [];
                prevBlock.value.forEach((el, i) => el !== null ? coupledBlock.push(el) : coupledBlock.push(nextBlock.value[i] as string));
                const prevBlockIndex = newTempl.findIndex(el => el.id === prevBlock.id);
                if (prevBlockIndex != -1) {
                    const obj: ITemplateNote = { id: prevBlock.id, value: coupledBlock }
                    if (prevBlock.nesting !== undefined && nextBlock.nesting !== undefined) {
                        obj.nesting = prevBlock.nesting >= nextBlock.nesting ? prevBlock.nesting : nextBlock.nesting
                    }
                    else if (prevBlock.nesting != undefined) { obj.nesting = prevBlock.nesting }
                    else if (nextBlock.nesting != undefined) { obj.nesting = nextBlock.nesting }
                    if (prevBlock.parentId) obj.parentId = prevBlock.parentId
                    if (nextBlock.startWhithId && nextBlock.startWhithId !== prevBlock.id) {
                        //Не должно выполняться
                        obj.startWhithId = nextBlock.startWhithId
                    }
                    newTempl.splice(prevBlockIndex, 2, obj)
                }
            }
            setLastActiveElement(prevBlock.id)
            setTempl(newTempl);
        }
    }, [templ])
    function clickIfThenElse() {
        let index = -1;
        let isArray = false
        let nest = null;
        let valueForNextBlock = '';
        let currentElement: ITemplateNote | null = null;
        for (let i = 0; i < templ.length; i++) {
            if (templ[i].id == lastActiveElement) {
                index = i;
                if ('nesting' in templ[i]) {
                    //Получаем вложенность текущего элемента
                    nest = templ[i].nesting;
                }
                if (Array.isArray(templ[i].value)) {
                    //Проверяем является ли текущий элемент блоком [If-then-else]
                    currentElement = templ[i];
                    let valueString = (templ[i].value[lastActiveIfThenElseField] as string)
                    valueForNextBlock = valueString.slice(lastCursorPosition);
                    isArray = true;
                } else {
                    let value = templ[i].value as string;
                    currentElement = { ...templ[i], value: value.slice(0, lastCursorPosition) };
                    valueForNextBlock = value.slice(lastCursorPosition);
                }
                break;
            }
        }
        if (nest && nest + 1 > 10) {
            if (!infoMessage) {
                setInfoMessage('Максимальное число вложенных блоков - 10');
            }
            return;
        }
        if (index != -1 && currentElement != null) {
            if (!isArray) {
                if (index == templ.length - 1) {
                    //Если элемент последний в списке то вставляем после него блок [if-then-else] и ещё один инпут
                    const changedTempl: ITemplateNote[] = [
                        ...templ.slice(0, index),
                        currentElement,
                        { id: createId(), value: ['', '', ''], nesting: nest != null ? nest + 1 : 0 },
                        { id: createId(), value: valueForNextBlock }
                    ]
                    setTempl(changedTempl);
                } else {
                    //Если элемент не последний в списке то вставляем после него блок [if-then-else], ещё один инпут и остальные блоки
                    const prevBlock = templ[index];
                    const ifthenelseBlock: ITemplateNote = { id: createId(), value: ['', '', ''], nesting: nest != null ? nest : 0 };
                    const input: ITemplateNote = { id: createId(), value: valueForNextBlock, nesting: nest != null ? nest : 0 }
                    if (prevBlock.parentId) {
                        ifthenelseBlock.parentId = prevBlock.parentId;//Сохраняем id родителя
                        input.parentId = prevBlock.parentId;//Сохраняем id родителя
                    }
                    const changedTempl: ITemplateNote[] = [
                        ...templ.slice(0, index),
                        currentElement,
                        ifthenelseBlock,
                        input,
                        ...templ.slice(index + 1, templ.length)
                    ];
                    setTempl(changedTempl);
                }
            } else {
                /*Если текущий элемент - блок [if-then-else], разбиваем блок на 2 части, вставляем между ними блок [if-then-else],
                ещё один инпут и остальные блоки(блок [if-then-else] не может быть последним)*/
                const fieldNumber = lastActiveIfThenElseField;
                const ifThenElseBlock = Object.assign({}, templ[index]);
                let val = ifThenElseBlock.value as (string | null)[]

                let fistBlockPart = val.map((el, i) => {
                    if (i < fieldNumber) {
                        return el;
                    } else if (i === fieldNumber) {
                        if (el !== null) {
                            return el.slice(0, lastCursorPosition);//У текщего элемента оставляем всю строку до курсора
                        } else {
                            return null //Не должно срабатывать
                        }
                    } else {
                        return null
                    }
                }); //Первая часть разбиваемого блока 
                let secondBlockPart = val.map((el, i) => i > fieldNumber ? el : null);
                //Вторая часть разбиваемого блока (если вставляем блок после else то эта часть должна быть [null, null, null])
                const firstPart: ITemplateNote = { id: ifThenElseBlock.id, value: fistBlockPart, nesting: nest != null ? nest : 0 }
                if (ifThenElseBlock.parentId) firstPart.parentId = ifThenElseBlock.parentId;
                const secondPart: ITemplateNote = {
                    id: createId(),
                    value: secondBlockPart,
                    nesting: nest != null ? nest : 0,
                }

                const checkLastBlock = templ.find(el => {
                    if ((el.startWhithId === ifThenElseBlock.id && el.startWhithId !== undefined) ||
                        (el.parentId === ifThenElseBlock.id && el.parentId !== undefined)) {//Текущий блок уже является составным
                        return true;
                    }
                    return false
                })
                //checkLastBlock хранит info был ли текущий блок уже разбит и если да, является ли уже существующее разбиение более низким чем текущее
                if (!checkLastBlock) {
                    //Текущее разбиение самое низкое, сохраняем в нём самое начало блока
                    secondPart.startWhithId = ifThenElseBlock.startWhithId ? ifThenElseBlock.startWhithId : ifThenElseBlock.id
                }

                const changedTempl: ITemplateNote[] = [
                    ...templ.slice(0, index),
                    firstPart,
                    { id: createId(), value: ['', '', ''], nesting: nest != null ? nest + 1 : 0, parentId: ifThenElseBlock.id },
                    { id: createId(), value: valueForNextBlock, nesting: nest != null ? nest + 1 : 0, parentId: ifThenElseBlock.id },
                ]

                let NullCount = (secondPart.value as (string | null)[]).reduce((cur, el) => el === null ? cur + 1 : cur, 0);
                if (NullCount < 3 || secondPart.startWhithId) {//Проверяем нужно ли добавлять 2 часть
                    changedTempl.push(secondPart)
                }
                let rest = [...templ.slice(index + 1, templ.length)];

                if (checkLastBlock && NullCount < 3) {
                    /*Если сначала было разбито более низое поле(например else), а после разбили более высокое(например then),
                    значения parentId у дочерних элементов более низкого поля (блока else) становятся не валидными(так как изменяется id блока else)*/
                    for (let i = 0; i < rest.length; i++) {
                        if (rest[i].parentId === ifThenElseBlock.id) {
                            rest[i].parentId = secondPart.id;
                        }
                    }
                }
                changedTempl.push(...rest);
                setTempl(changedTempl);

            }
        }
    }
    const previewCallback = useCallback(() => setPreviewMessageShift(0), []);
    const closeCallback = useCallback(() => {
        if (_closeCallback) {
            _closeCallback();
        }
    }, []);
    const saveCallback = useCallback(() => {
        if (callbackSave) {
            if (!infoMessage) {
                setInfoMessage('Шаблон сохранён');
            }
            callbackSave(templ)
        }
    }, [templ, callbackSave]);
    useEffect(() => {
        if (infoMessage) {
            setTimeout(() => setInfoMessage(''), 3100);
        }
    }, [infoMessage])
    return (
        <>
            <div
                style={{
                    width: previewMessageShift ? '100%' : '80%'
                }}
                className={classes.TemplateEditingWrap}
            >
                <div className={classes.TemplateEditing}>
                    <div className={classes.variablesWrap}>
                        <span className={classes.titleSpan}>Variables</span>
                        <div className={classes.variables}>
                            {
                                arrVarNames.map((v, i) => <div onClick={() => clickVariables(v)} key={v + i} className={classes.variable}>{`{${v}}`}</div>)
                            }
                        </div>
                    </div>
                    <div className={classes.messageWrap}>
                        <span className={classes.titleSpan}>Message template</span>
                        <div className={classes.messageContent}>
                            {
                                templ.map(el => {
                                    if (Array.isArray(el.value)) {
                                        return <IfThenElse
                                            key={el.id}
                                            fieldState={el as { id: string, value: (null | string)[] }}
                                            Blur={Blur}
                                            deleteIfThenElseBlock={deleteIfThenElseBlock}
                                            setLastActiveIfThenElseField={setLastActiveIfThenElseField}
                                        />
                                    } else {
                                        return <AutoResizeInput
                                            style={{
                                                marginLeft: el.nesting ? `calc(${el.nesting * 7}%  + ${(100 - ((el.nesting) * 7)) / 100 * 7}%)` : '',
                                                /*7 * nesting - отступ блока [if-then-else]
                                                ${(100 - (el.nesting * 7))/100 * 7}% - ширина кнопки close в блоке [if-then-else]*/
                                                width: el.nesting ? `calc(100% - ${(el.nesting * 7)}% - 10px - ${(100 - ((el.nesting) * 7)) / 100 * 7}%)` : ''
                                                /* 7 * nesting - отступ блока [if-then-else]
                                                ${(100 - (el.nesting * 7))/100 * 7}% - ширина кнопки close в блоке [if-then-else]
                                                10px padding*/
                                            }}
                                            key={el.id}
                                            textWhithVariables={el.value as string}
                                            onBlur={e => Blur(e.currentTarget.value, el.id, e.currentTarget.selectionStart)} />
                                    }
                                })
                            }
                        </div>
                        <Button onClick={clickIfThenElse} className={classes.IfThenElseButton}>IF-THEN-ELSE</Button>
                    </div>
                    <TemplateEditingButtons previewCallback={previewCallback} saveCallback={saveCallback} closeCallback={closeCallback} />
                </div>
            </div>
            <div
                className={classes.TemplatePreviewWrap}
                style={{
                    transform: `translateX(${previewMessageShift}%)`,
                }}
            >
                <div onClick={() => setPreviewMessageShift(102)} className={classes.CloseIcoWrap}>
                    <GrClose className={classes.CloseIco} />
                </div>
                <TemplatePreview arrVarNames={arrVarNames} template={templ} />
            </div>
            {infoMessage && <div className={classes.infoMessage}>{infoMessage}</div>}
        </>
    );
};

export default TemplateEditing;