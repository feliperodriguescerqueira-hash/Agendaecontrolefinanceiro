import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Tabs, Tab, Box, Typography, TextField, Grid, FormControlLabel,
  Checkbox, Switch, Divider, FormGroup, Chip, IconButton
} from '@mui/material';
import { useAppData, Anamnesis } from '../hooks/useAppData';
import { Activity, HeartPulse, Sparkles, Coffee, Target, FileSignature, FileText, Send, Eraser } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- COMPONENTE DE ASSINATURA (DESENHO) ---
const SignaturePad = ({ title, value, onSave, onClear }: { title: string, value?: string, onSave: (v: string) => void, onClear: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && value) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => ctx?.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [value]);

  const startDraw = (e: any) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDraw = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath();
      onSave(canvasRef.current.toDataURL());
    }
  };

  const draw = (e: any) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      onClear();
    }
  };

  return (
    <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, bgcolor: '#fff', position: 'relative' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <IconButton size="small" onClick={clear} title="Limpar Assinatura" className="no-print"><Eraser size={16} /></IconButton>
      </Typography>
      <canvas
        ref={canvasRef}
        width={350}
        height={150}
        style={{ border: '1px dashed #e0e0e0', borderRadius: '4px', cursor: 'crosshair', touchAction: 'none', width: '100%' }}
        onMouseDown={startDraw} onMouseUp={endDraw} onMouseMove={draw} onMouseOut={endDraw}
        onTouchStart={startDraw} onTouchEnd={endDraw} onTouchMove={draw}
      />
    </Box>
  );
};

// 👇 CORREÇÃO 1: Este TabPanel agora permite que TODAS as abas apareçam na hora de imprimir o PDF
interface TabPanelProps { children?: React.ReactNode; index: number; value: number; title: string; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, title, ...other } = props;
  return (
    <div role="tabpanel" className={`tab-panel ${value === index ? 'active' : ''}`} {...other}>
      <Box sx={{ pt: 3 }}>
        {/* Título que só aparece no PDF para organizar as páginas */}
        <Typography variant="h6" className="print-only-title" sx={{ display: 'none', mb: 2, color: 'primary.main', borderBottom: '1px solid #ccc', pb: 1 }}>
          {title}
        </Typography>
        {children}
      </Box>
    </div>
  );
}

export function AnamnesisForm({ open, onClose, clientId, existingData }: any) {
  const { saveAnamnesis, clients } = useAppData();
  const [tabIndex, setTabIndex] = useState(0);

  const [formData, setFormData] = useState<Partial<Anamnesis>>({
    client_id: clientId, data_atendimento: new Date().toISOString().split('T')[0],
    modalidade_emagrecimento: [], ativo_glp1: false, condicoes_saude: [],
    suplementacao: [], queixas_dermatologicas: [], procedimentos_anteriores: [],
    objetivos: [], termo_aceito: false, assinatura_paciente: '', assinatura_profissional: ''
  });

  useEffect(() => {
    if (existingData) {
      setFormData({ 
        ...existingData,
        modalidade_emagrecimento: existingData.modalidade_emagrecimento || [],
        condicoes_saude: existingData.condicoes_saude || [], suplementacao: existingData.suplementacao || [],
        queixas_dermatologicas: existingData.queixas_dermatologicas || [],
        procedimentos_anteriores: existingData.procedimentos_anteriores || [],
        objetivos: existingData.objetivos || [],
        termo_aceito: existingData.termo_aceito || false
      });
    } else {
      setFormData(prev => ({ ...prev, client_id: clientId }));
    }
  }, [existingData, clientId, open]);

  useEffect(() => {
    if (formData.peso_atual && formData.altura) {
      const imc = formData.peso_atual / (formData.altura * formData.altura);
      setFormData(prev => ({ ...prev, imc: parseFloat(imc.toFixed(2)) }));
    }
    if (formData.peso_max && formData.peso_atual) {
      const perdido = formData.peso_max - formData.peso_atual;
      setFormData(prev => ({ ...prev, total_perdido: perdido > 0 ? parseFloat(perdido.toFixed(2)) : 0 }));
    }
  }, [formData.peso_atual, formData.altura, formData.peso_max]);

  const handleArrayChange = (field: keyof Anamnesis, value: string) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      const newArray = currentArray.includes(value) ? currentArray.filter(i => i !== value) : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSave = async () => {
    if (!formData.client_id) return;
    await saveAnamnesis(formData as Anamnesis);
    onClose();
  };

  const clientName = clients.find(c => c.id === clientId)?.name || 'Cliente';
  const clientPhone = clients.find(c => c.id === clientId)?.phone || '';

  // --- FUNÇÕES DE EXPORTAÇÃO ---
  const handlePrintPDF = () => {
    window.print();
  };

  // 👇 CORREÇÃO 2: Mensagem de WhatsApp super completa e formatada
  const handleWhatsApp = () => {
    const dataFormatada = formData.data_atendimento ? format(parseISO(formData.data_atendimento), 'dd/MM/yyyy') : 'Não informada';
    const objetivosStr = formData.objetivos?.length ? formData.objetivos.join(', ') : 'Não preenchidos';
    const saudeStr = formData.condicoes_saude?.length ? formData.condicoes_saude.join(', ') : 'Nenhuma relatada';
    
    const text = `*Ficha Clínica - Studio Mari Moraes* 📋✨\n\n` +
      `*Paciente:* ${clientName}\n` +
      `*Data:* ${dataFormatada}\n\n` +
      `*⚖️ Biometria:*\n- Peso Atual: ${formData.peso_atual || '- '}kg\n- IMC: ${formData.imc || '-'}\n\n` +
      `*🎯 Objetivos Principais:*\n${objetivosStr}\n\n` +
      `*🩺 Condições de Saúde (Atenção):*\n${saudeStr}\n\n` +
      `*✅ Termo de Responsabilidade:*\nAssinado e Validado digitalmente.\n\n` +
      `Agradecemos a confiança! Em caso de dúvidas, estamos à disposição.`;
      
    const num = clientPhone.replace(/\D/g, '');
    if (num) {
      window.open(`https://wa.me/55${num}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      alert("A cliente não possui telefone cadastrado.");
    }
  };

  return (
    <>
      <style>
        {`
          .tab-panel { display: none; }
          .tab-panel.active { display: block; }

          /* Regras Mágicas para o PDF sair perfeito */
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .no-print { display: none !important; }
            .MuiDialog-paper { box-shadow: none !important; max-width: 100% !important; width: 100% !important; margin: 0 !important; }
            
            /* Força todas as abas a aparecerem na impressão */
            .tab-panel { display: block !important; page-break-inside: avoid; margin-bottom: 30px; }
            
            /* Mostra os títulos invisíveis só no papel */
            .print-only-title { display: block !important; }
            
            /* Esconde a barra de botões das abas para não poluir o PDF */
            .MuiTabs-root { display: none !important; }
          }
        `}
      </style>

      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth id="print-area">
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Ficha de Anamnese Clínica</Typography>
          <Typography variant="body2">Paciente: {clientName}</Typography>
        </DialogTitle>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }} className="no-print">
          <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Activity size={18} />} iconPosition="start" label="Emagrecimento" />
            <Tab icon={<HeartPulse size={18} />} iconPosition="start" label="Saúde" />
            <Tab icon={<Sparkles size={18} />} iconPosition="start" label="Pele" />
            <Tab icon={<Coffee size={18} />} iconPosition="start" label="Estilo" />
            <Tab icon={<Target size={18} />} iconPosition="start" label="Objetivos" />
            <Tab icon={<FileSignature size={18} />} iconPosition="start" label="Assinaturas" sx={{ color: 'error.main', fontWeight: 'bold' }} />
          </Tabs>
        </Box>

        <DialogContent sx={{ minHeight: '60vh', bgcolor: '#fafafa', pb: 6 }}>
          
          <TabPanel value={tabIndex} index={0} title="1. Histórico de Emagrecimento">
             <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Data do Atendimento:</Typography>
                <TextField type="date" fullWidth size="small" value={formData.data_atendimento || ''} onChange={e => setFormData({...formData, data_atendimento: e.target.value})} />
              </Grid>
              <Grid item xs={12}><Divider><Chip label="Biometria" /></Divider></Grid>
              <Grid item xs={6} sm={3}><TextField label="Altura (m)" type="number" fullWidth size="small" value={formData.altura || ''} onChange={e => setFormData({...formData, altura: Number(e.target.value)})} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Peso Atual (kg)" type="number" fullWidth size="small" value={formData.peso_atual || ''} onChange={e => setFormData({...formData, peso_atual: Number(e.target.value)})} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Peso Máximo (kg)" type="number" fullWidth size="small" value={formData.peso_max || ''} onChange={e => setFormData({...formData, peso_max: Number(e.target.value)})} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Total Perdido (kg)" type="number" fullWidth size="small" value={formData.total_perdido || ''} disabled sx={{ bgcolor: '#eee' }} /></Grid>
              
              <Grid item xs={12}><Divider sx={{ mt: 2 }}><Chip label="Estratégia de Emagrecimento" /></Divider></Grid>
              <Grid item xs={12}>
                <FormGroup row>
                  {['Bariátrica', 'Dieta', 'Exercício', 'Medicação (GLP-1)'].map(opt => (
                    <FormControlLabel key={opt} control={<Checkbox checked={formData.modalidade_emagrecimento?.includes(opt)} onChange={() => handleArrayChange('modalidade_emagrecimento', opt)} />} label={opt} />
                  ))}
                </FormGroup>
              </Grid>
              
              {formData.modalidade_emagrecimento?.includes('Medicação (GLP-1)') && (
                <Grid item xs={12} container spacing={2} sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 2, mt: 1 }}>
                  <Grid item xs={12}>
                    <FormControlLabel control={<Switch checked={formData.ativo_glp1 || false} onChange={e => setFormData({...formData, ativo_glp1: e.target.checked})} />} label={<b>Uso Ativo de GLP-1 (Ozempic/Mounjaro)?</b>} />
                  </Grid>
                  <Grid item xs={12} sm={4}><TextField label="Tempo de Uso" fullWidth size="small" value={formData.tempo_glp1 || ''} onChange={e => setFormData({...formData, tempo_glp1: e.target.value})} /></Grid>
                  <Grid item xs={12} sm={4}><TextField label="Dose Atual" fullWidth size="small" value={formData.dose_glp1 || ''} onChange={e => setFormData({...formData, dose_glp1: e.target.value})} /></Grid>
                  <Grid item xs={12} sm={4}><TextField label="Endocrinologista" fullWidth size="small" value={formData.endocrinologista || ''} onChange={e => setFormData({...formData, endocrinologista: e.target.value})} /></Grid>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabIndex} index={1} title="2. Histórico de Saúde">
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="subtitle2" color="primary">Condições Preexistentes</Typography></Grid>
              <Grid item xs={12}>
                <FormGroup row>
                  {['Hipertensão', 'Diabetes', 'Hipotireoidismo', 'SOP', 'Autoimune', 'Problemas Renais', 'Alergias'].map(opt => (
                    <FormControlLabel key={opt} control={<Checkbox checked={formData.condicoes_saude?.includes(opt)} onChange={() => handleArrayChange('condicoes_saude', opt)} />} label={opt} />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Quais medicamentos de uso contínuo?</Typography>
                <TextField fullWidth multiline rows={2} value={formData.medicamentos_continuos || ''} onChange={e => setFormData({...formData, medicamentos_continuos: e.target.value})} />
              </Grid>
              <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>Suplementação Ativa</Typography></Grid>
              <Grid item xs={12}>
                <FormGroup row>
                  {['Colágeno', 'Whey Protein', 'Vitaminas', 'Creatina', 'Ferro'].map(opt => (
                    <FormControlLabel key={opt} control={<Checkbox checked={formData.suplementacao?.includes(opt)} onChange={() => handleArrayChange('suplementacao', opt)} />} label={opt} />
                  ))}
                </FormGroup>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabIndex} index={2} title="3. Avaliação da Pele e Tegumento">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Tipo de Pele (Rosto/Corpo)</Typography>
                <FormGroup row>
                  {['Oleosa', 'Seca', 'Mista', 'Normal', 'Sensível/Reativa'].map(opt => (
                    <FormControlLabel key={opt} control={<Checkbox checked={formData.tipo_pele === opt} onChange={() => setFormData({...formData, tipo_pele: opt})} />} label={opt} />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Queixas Dermatológicas</Typography>
                <FormGroup row>
                  {['Acne', 'Melasma/Manchas', 'Flacidez Tissular', 'Flacidez Muscular', 'Gordura Localizada', 'Celulite', 'Estrias'].map(opt => (
                    <FormControlLabel key={opt} control={<Checkbox checked={formData.queixas_dermatologicas?.includes(opt)} onChange={() => handleArrayChange('queixas_dermatologicas', opt)} />} label={opt} />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Alterações notadas após Emagrecimento:</Typography>
                <TextField fullWidth multiline rows={2} value={formData.alteracoes_pos_emagrecimento || ''} onChange={e => setFormData({...formData, alteracoes_pos_emagrecimento: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Cosméticos que usa atualmente em casa:</Typography>
                <TextField fullWidth multiline rows={2} value={formData.cosmeticos_atuais || ''} onChange={e => setFormData({...formData, cosmeticos_atuais: e.target.value})} />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabIndex} index={3} title="4. Estilo de Vida">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Ingestão de Água (Litros/dia):</Typography>
                <TextField fullWidth size="small" value={formData.ingestao_agua || ''} onChange={e => setFormData({...formData, ingestao_agua: e.target.value})} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Horas de Sono por noite:</Typography>
                <TextField fullWidth size="small" value={formData.horas_sono || ''} onChange={e => setFormData({...formData, horas_sono: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Atividade Física (Tipo e Frequência):</Typography>
                <TextField fullWidth size="small" value={formData.atividade_fisica || ''} onChange={e => setFormData({...formData, atividade_fisica: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Qualidade Alimentar:</Typography>
                <TextField fullWidth multiline rows={2} value={formData.qualidade_alimentar || ''} onChange={e => setFormData({...formData, qualidade_alimentar: e.target.value})} />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabIndex} index={4} title="5. Objetivos com o Tratamento">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Objetivo Principal do Tratamento Estético</Typography>
                <FormGroup row>
                  {['Redução de Medidas', 'Tratar Flacidez', 'Rejuvenescimento Facial', 'Tratar Manchas', 'Relaxamento'].map(opt => (
                    <FormControlLabel key={opt} control={<Checkbox checked={formData.objetivos?.includes(opt)} onChange={() => handleArrayChange('objetivos', opt)} />} label={opt} />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Expectativa do Paciente:</Typography>
                <TextField fullWidth multiline rows={2} value={formData.expectativa || ''} onChange={e => setFormData({...formData, expectativa: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Anotações Técnicas / Plano de Tratamento (Uso exclusivo):</Typography>
                <TextField fullWidth multiline rows={4} value={formData.observacoes_esteticista || ''} onChange={e => setFormData({...formData, observacoes_esteticista: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f0f7ff' } }} />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabIndex} index={5} title="6. Termo de Ciência e Assinaturas">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ p: 3, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                  <Typography variant="h6" color="warning.dark" gutterBottom>Termo de Responsabilidade</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'justify' }}>
                    Declaro que as informações acima são verdadeiras e não omiti nenhum dado sobre minha saúde. Fui informado(a) sobre os riscos, benefícios e cuidados pós-procedimento. Autorizo a realização dos procedimentos estéticos propostos pela profissional.
                  </Typography>
                  <FormControlLabel 
                    control={<Checkbox checked={formData.termo_aceito || false} onChange={e => setFormData({...formData, termo_aceito: e.target.checked})} color="warning" />} 
                    label={<b>Li e aceito os termos do tratamento.</b>} 
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <SignaturePad 
                  title={`Assinatura: ${clientName}`} 
                  value={formData.assinatura_paciente} 
                  onSave={(v) => setFormData({...formData, assinatura_paciente: v})} 
                  onClear={() => setFormData({...formData, assinatura_paciente: ''})}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <SignaturePad 
                  title="Assinatura: Profissional" 
                  value={formData.assinatura_profissional} 
                  onSave={(v) => setFormData({...formData, assinatura_profissional: v})} 
                  onClear={() => setFormData({...formData, assinatura_profissional: ''})}
                />
              </Grid>
            </Grid>
          </TabPanel>

        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }} className="no-print">
            <Button color="error" variant="outlined" startIcon={<FileText size={18} />} onClick={handlePrintPDF}>Gerar PDF</Button>
            <Button color="success" variant="contained" startIcon={<Send size={18} />} onClick={handleWhatsApp}>WhatsApp</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }} className="no-print">
            <Button onClick={onClose} color="inherit">Sair</Button>
            <Button onClick={handleSave} variant="contained" size="large" color="primary">Salvar Ficha</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}