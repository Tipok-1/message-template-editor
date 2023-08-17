import { TemplateGenerator } from "./TemplatePreview";

describe('TemplateGenerator tests', () => {
    test('Вызов без блоков [if-then-else]', () => {
        expect(TemplateGenerator([
            { id: '1', value: 'some text' }
        ], {})).toBe('some text')
    })

    test('Вызов c несоставным блоком [if-then-else]', () => {
        expect(TemplateGenerator([
            { id: '1', value: 'some text1 ' },
            { id: '2', value: ['if true', 'then', 'else'] },
            { id: '3', value: ' some text2' }
        ], {})).toBe(`some text1 then some text2`)
    })

    test('Вызов c составным полем if', () => {
        expect(TemplateGenerator([
            { id: '1', value: 'some text1 ' },
            { id: '2', value: ['', null, null] },
            { id: '3', value: ['', '', ''], parentId: '2' },
            { id: '4', value: '', parentId: '2' },
            { id: '5', value: [null, '', 'else'], startWhithId: '2' },
            { id: '6', value: ' some text2' }
        ], {})).toBe(`some text1 else some text2`)

        expect(TemplateGenerator([
            { id: '1', value: 'some text1 ' },
            { id: '2', value: ['', null, null] },
            { id: '3', value: ['if true', 'block with id 2 becomes true', ''], parentId: '2' },
            { id: '4', value: '', parentId: '2' },
            { id: '5', value: ['', '', ''], parentId: '2' },
            { id: '6', value: '', parentId: '2' },
            { id: '7', value: [null, 'then', 'else'], startWhithId: '2' },
            { id: '8', value: ' some text2' }
        ], {})).toBe(`some text1 then some text2`)

    })

    test('Вызов c составным полем then', () => {
        expect(TemplateGenerator([
            { id: '1', value: 'some text1 ' },
            { id: '2', value: ['{variable}', 'then 1 ', null] },
            { id: '3', value: ['if true', 'then 2 ', ''], parentId: '2' },
            { id: '4', value: 'then 1', parentId: '2' },
            { id: '5', value: [null, null, 'else'], startWhithId: '2' },
            { id: '6', value: ' some text2' }
        ], { 'variable': 'there is a meaning', })).toBe(`some text1 then 1 then 2 then 1 some text2`)
    })

    test('Вызов c составным полем else', () => {
        expect(TemplateGenerator([
            { id: '1', value: 'some text1 ' },
            { id: '2', value: ['{variable}', '', 'else 1 '] },
            { id: '3', value: ['if true', 'then 2 ', ''], parentId: '2' },
            { id: '4', value: 'else 1', parentId: '2' },
            { id: '5', value: [null, null, null], startWhithId: '2' },
            { id: '6', value: ' some text2' }
        ], { 'variable': '', })).toBe(`some text1 else 1 then 2 else 1 some text2`)
    })

    test('Вызов cо всеми составными полями', () => {
        expect(TemplateGenerator([
            { id: '1', value: 'some text1 ' },
            { id: '2', value: ['{variable}', null, null] },
            { id: '3', value: ['', '', ''], parentId: '2' },
            { id: '4', value: '', parentId: '2' },
            { id: '5', value: [null, '{then}', null] },
            { id: '6', value: ['text', '{then}2', '{else}2'], parentId: '5' },
            { id: '7', value: '{then}', parentId: '5' },
            { id: '8', value: [null, null, '{else}'] },
            { id: '9', value: ['', '{then}2', '{else}2'], parentId: '8' },
            { id: '10', value: 'else', parentId: '8' },
            { id: '11', value: [null, null, null], startWhithId: '2' },
            { id: '12', value: ' some text2' }
        ], { 'variable': 'value', 'then': 'then value', 'else': 'else value' })).toBe(`some text1 then valuethen value2then value some text2`)

        expect(TemplateGenerator([
            { id: '1', value: 'some text1 ' },
            { id: '2', value: ['{variable}', null, null] },
            { id: '3', value: ['', '', ''], parentId: '2' },
            { id: '4', value: '', parentId: '2' },
            { id: '5', value: [null, '{then}', null] },
            { id: '6', value: ['text', '{then}2', '{else}2'], parentId: '5' },
            { id: '7', value: '{then}', parentId: '5' },
            { id: '8', value: [null, null, '{else}'] },
            { id: '9', value: ['', '{then}2', '{else}2'], parentId: '8' },
            { id: '10', value: '{else}', parentId: '8' },
            { id: '11', value: [null, null, null], startWhithId: '2' },
            { id: '12', value: ' some text2' }
        ], { 'variable': '', 'then': 'then value', 'else': 'else value' })).toBe(`some text1 else valueelse value2else value some text2`)
    })

    test('Вызов с несколькими вложеными блоками [if-then-else]', () => {
        expect(TemplateGenerator([
            { id: '1', value: '' },
            { id: '2', value: ['if not empty', 'then1', null], nesting: 0 },
                { id: '3', value: ['if not empty', 'then2', null], nesting: 1, parentId: '2' },
                    { id: '4', value: ['if not empty', 'then3', ''], nesting: 2, parentId: '3' },
                    { id: '5', value: 'then2', nesting: 2, parentId: '3' },
                { id: '6', value: [null, null, ''], nesting: 1, startWhithId: '3' },
                { id: '7', value: 'then1', nesting: 1, parentId: '2' },
            { id: '8', value: [null, null, ''], nesting: 0, startWhithId: '2' },
            { id: '9', value: '' }
        ], {})).toBe(`then1then2then3then2then1`)
    })
})