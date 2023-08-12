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

const TemplateEditingButtons = memo(({ previewCallback, saveCallback }: ITemplateEditingButtons) => {
    return (
        <div className={classes.buttonsWrap}>
            <div className={classes.buttonsCenterWrap}>
                <Button onClick={previewCallback} ico={IcoType.preview}>Preview</Button>
                <Button ico={IcoType.save} onClick={saveCallback}>Save</Button>
                <Button ico={IcoType.close}>Close</Button>
            </div>
        </div>
    )
})
const TemplateEditing = ({ arrVarNames, template }: ITemplateEditing) => {
    const [previewMessageShift, setPreviewMessageShift] = useState(102);
    const [lastActiveElement, setLastActiveElement] = useState<string>(createId());
    const [lastCursorPosition, setLastCursorPosition] = useState<number>(0);
    const [lastActiveIfThenElseField, setLastActiveIfThenElseField] = useState<number>(0);
    const [templ, setTempl] = useState<ITemplateNote[]>(template || [{ id: lastActiveElement, value: '' }])

    const Blur = useCallback(function BlurFN(val: string, id: string, cursorPosition: number, fieldNumber?: number) {
        //Обновляем state только после потери фокуса
        setTempl(prev => prev.map(el => {
            if (el.id != id) {
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
    function clickSave() {
        //setTimeout(() => console.log(templ), 0);
    }
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
                            value: el.value.slice(0,lastCursorPosition) + `{${variables}}` +  el.value.slice(lastCursorPosition)
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
                            (arrEl !== null) ? arrEl.slice(0, lastCursorPosition) + `{${variables}}`+ arrEl.slice(lastCursorPosition): arrEl
                            : arrEl),
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
        let startRemovedIndex = templ.findIndex(el => el.id == id);
        const prevBlock = templ[startRemovedIndex - 1];
        let nextBlock = templ[startRemovedIndex + 2];
        let isCompositeBlock = false;
        if (block) {
            let endRemovedIndex = templ.findIndex(el => {
                if ('startWhithId' in el) {
                    if (el.startWhithId == id) {
                        return true;
                    }
                }
                return false
            })
            if (endRemovedIndex != -1) {
                isCompositeBlock = true;
            }
            let newTempl: ITemplateNote[] = [];
            if (isCompositeBlock) {
                console.log('composed')
                newTempl = templ.filter((_, i) => {
                    if (i >= startRemovedIndex && i <= endRemovedIndex + 1) {
                        return false
                    }
                    return true;
                });
                nextBlock = templ[endRemovedIndex + 2];
            } else {
                console.log('Not composed')
                newTempl = templ.filter((el, i) => {
                    if (el.id == id || i == startRemovedIndex + 1) {
                        return false
                    }
                    return true
                });
            }
            if (Array.isArray(prevBlock.value) && Array.isArray(nextBlock.value)) {
                let coupledBlock: string[] = [];
                prevBlock.value.forEach((el, i) => el != null ? coupledBlock.push(el) : coupledBlock.push(nextBlock.value[i] as string));
                const prevBlockIndex = newTempl.findIndex(el => el.id === prevBlock.id);
                if (prevBlockIndex != -1) {
                    const obj: ITemplateNote = { id: prevBlock.id, value: coupledBlock }
                    if (prevBlock.nesting != undefined) obj.nesting = prevBlock.nesting
                    if (nextBlock.startWhithId) obj.startWhithId = nextBlock.startWhithId
                    if (prevBlock.parentId) obj.parentId = prevBlock.parentId
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
        for (let i = 0; i < templ.length; i++) {
            if (templ[i].id == lastActiveElement) {
                index = i;
                if ('nesting' in templ[i]) {
                    //Получаем вложенность текущего элемента
                    nest = templ[i].nesting;
                }
                if (Array.isArray(templ[i].value)) {
                    //Проверяем является ли текущий элемент блоком [If-then-else]
                    isArray = true;
                }
                break;
            }
        }
        if (nest && nest + 1 > 10) {
            alert('Максимальное число вложенных блоков - 10');
            return;
        }
        if (index != -1) {
            if (!isArray) {
                if (index == templ.length - 1) {
                    //Если элемент последний в списке то вставляем после него блок [if-then-else] и ещё один инпут
                    const changedTempl: ITemplateNote[] = [
                        ...templ.slice(0, index + 1),
                        { id: createId(), value: ['', '', ''], nesting: nest != null ? nest + 1 : 0 },
                        { id: createId(), value: '' }
                    ]
                    setTempl(changedTempl);
                } else {
                    //Если элемент не последний в списке то вставляем после него блок [if-then-else], ещё один инпут и остальные блоки
                    const changedTempl: ITemplateNote[] = [
                        ...templ.slice(0, index + 1),
                        { id: createId(), value: ['', '', ''], nesting: nest != null ? nest + 1 : 0 },
                        { id: createId(), value: '', nesting: nest != null ? nest : 0 },
                        ...templ.slice(index + 1, templ.length)
                    ];
                    setTempl(changedTempl);
                }
            } else {
                /*Если текущий элемент - блок [if-then-else] разбиваем блок на 2 часи и между ними вставляем блок [if-then-else] 
                и ещё один инпут и остальные блоки(блок [if-then-else] не может быть последним)*/
                const fieldNumber = lastActiveIfThenElseField;
                const ifThenElseBlock = Object.assign({}, templ[index]);
                let val = ifThenElseBlock.value as (string | null)[]

                let fistBlockPart = val.map((el, i) => i <= fieldNumber ? el : null);
                //Первая часть разбиваемого блока 
                let secondBlockPart = val.map((el, i) => i > fieldNumber ? el : null);
                //Вторая часть разбиваемого блока (если вставляем блок после else то эта часть должна быть [null, null, null])

                const firstPart: ITemplateNote = { id: ifThenElseBlock.id, value: fistBlockPart, nesting: nest != null ? nest : 0 }
                if (ifThenElseBlock.parentId) firstPart.parentId = ifThenElseBlock.parentId;
                const changedTempl: ITemplateNote[] = [
                    ...templ.slice(0, index),
                    firstPart,
                    { id: createId(), value: ['', '', ''], nesting: nest != null ? nest + 1 : 0 },
                    { id: createId(), value: '', nesting: nest != null ? nest + 1 : 0, parentId: ifThenElseBlock.id },
                    {
                        id: createId(),
                        value: secondBlockPart,
                        nesting: nest != null ? nest : 0,
                        startWhithId: ifThenElseBlock.startWhithId ? ifThenElseBlock.startWhithId : ifThenElseBlock.id,
                        parentId: ifThenElseBlock.id
                        /*Если один и тот же [if-then-else] блок разбивают более одного раза(например разбили на if и thenElse, а потом разбили then или else)
                         то в fistBlockPart уже должен быть startWhithId(ключ к началу разбиения) иначе сам fistBlockPart - начало(то есть часть с if)
                         Максимальное разбиение одного блока 3 раза - каждую часть*/
                    },
                    ...templ.slice(index + 1, templ.length)
                ]
                setTempl(changedTempl);

            }
        }
    }
    const previewCallback = useCallback(() => setPreviewMessageShift(0), []);
    const saveCallback = useCallback(() => clickSave(), []);

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
                    <TemplateEditingButtons previewCallback={previewCallback} saveCallback={saveCallback} />
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
        </>
    );
};

export default TemplateEditing;