export interface ITemplateNote {
    id: string, //Ключ для использования в map
    value: string | (null | string)[],//Если value массив - это block [if-then-else] 
    nesting?:number// Максимальная вложенность 10
    parentId?:string
    startWhithId?:string // Помечает последний блок разбитого [if-then-else] для коректного удаления вложенных блоков
}

export interface ITemplateEditing {
    arrVarNames: string[],
    template?: ITemplateNote[] | null,
    callbackSave?: (template:ITemplateNote[]) => void,
    _closeCallback?:()=>void
}

export interface ITemplateEditingButtons{
    previewCallback:()=>void,
    saveCallback:()=>void,
    closeCallback:()=>void
}