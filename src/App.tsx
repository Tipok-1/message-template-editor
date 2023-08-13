import { useState, useCallback } from 'react';
import TemplateEditing from './components/TemplateEditing/TemplateEditing';
import classes from './App.module.css'
import Button from './components/UI/Button/Button';
import { ITemplateNote } from './components/TemplateEditing/types';

function App() {
  const [arrVarNames, setArrVarNames] = useState<string[]>([]);
  const [template, setTemplate] = useState(null);
  const [openMessageEditor, setOpenMessageEditor] = useState(false);

  function clickOpenEditorButton(){
    if (localStorage.getItem('arrVarNames')) {
      const arrVar = JSON.parse(localStorage.getItem('arrVarNames') as string);
      setArrVarNames(arrVar);
    } else {
      setArrVarNames(['firstname', 'lastname', 'company', 'position']);
    }
    if(localStorage.getItem('template')) {
      let templ = JSON.parse(localStorage.getItem('template') as string);
      setTemplate(templ);
    } 
    setOpenMessageEditor(true)
  }
  const callbackSave = useCallback((template:ITemplateNote[])=>{
    const templ = JSON.stringify(template);
    localStorage.setItem('template', templ);
  }, [])
  return (
    <div className={classes.content}>
      {!openMessageEditor ? <Button className={classes.openEditorButton} onClick={()=>clickOpenEditorButton()}>Message Editor</Button>
      : <TemplateEditing arrVarNames={arrVarNames} template={template} callbackSave={callbackSave} _closeCallback={()=>setOpenMessageEditor(false)}/>
      }
    </div>
  );
}

export default App;
