'use client';

import { useState } from 'react';
import { Language, t } from '@/lib/i18n';
import { submitLead, validateEmail, validatePhone, LeadData } from '@/lib/leads';
import { trackFormInteraction, trackCTAClick } from '@/lib/analytics';
import { Send, Phone, Mail, Building2, MessageSquare, Loader2, CheckCircle } from 'lucide-react';

interface LeadCaptureFormProps {
  businessId?: string;
  businessName?: string;
  cityId?: string;
  categoryId?: string;
  lang: Language;
  variant?: 'default' | 'compact' | 'sidebar';
  leadType?: 'contact' | 'quote' | 'callback';
  onSuccess?: (leadId: string) => void;
}

export function LeadCaptureForm({
  businessId,
  businessName,
  cityId,
  categoryId,
  lang,
  variant = 'default',
  leadType = 'contact',
  onSuccess,
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const translations: Record<Language, Record<string, string>> = {
    en: {
      title: leadType === 'quote' ? 'Get a Free Quote' : leadType === 'callback' ? 'Request a Callback' : 'Contact Us',
      subtitle: businessName ? `Send a message to ${businessName}` : 'Fill out the form below',
      name: 'Your Name',
      email: 'Email Address',
      phone: 'Phone Number',
      company: 'Company (Optional)',
      message: 'Your Message',
      submit: leadType === 'quote' ? 'Get Quote' : leadType === 'callback' ? 'Request Callback' : 'Send Message',
      submitting: 'Sending...',
      success: 'Thank you! We\'ll be in touch soon.',
      errorName: 'Please enter your name',
      errorContact: 'Please enter email or phone',
      errorEmail: 'Please enter a valid email',
      errorPhone: 'Please enter a valid phone number',
    },
    es: {
      title: leadType === 'quote' ? 'Obtener Cotización Gratis' : leadType === 'callback' ? 'Solicitar Llamada' : 'Contáctenos',
      subtitle: businessName ? `Enviar mensaje a ${businessName}` : 'Complete el formulario',
      name: 'Su Nombre',
      email: 'Correo Electrónico',
      phone: 'Número de Teléfono',
      company: 'Empresa (Opcional)',
      message: 'Su Mensaje',
      submit: leadType === 'quote' ? 'Obtener Cotización' : leadType === 'callback' ? 'Solicitar Llamada' : 'Enviar Mensaje',
      submitting: 'Enviando...',
      success: '¡Gracias! Nos pondremos en contacto pronto.',
      errorName: 'Por favor ingrese su nombre',
      errorContact: 'Por favor ingrese email o teléfono',
      errorEmail: 'Por favor ingrese un email válido',
      errorPhone: 'Por favor ingrese un teléfono válido',
    },
    sr: {
      title: leadType === 'quote' ? 'Добијте бесплатну понуду' : leadType === 'callback' ? 'Затражите позив' : 'Контактирајте нас',
      subtitle: businessName ? `Пошаљите поруку ${businessName}` : 'Попуните формулар',
      name: 'Ваше име',
      email: 'Имејл адреса',
      phone: 'Број телефона',
      company: 'Компанија (опционо)',
      message: 'Ваша порука',
      submit: leadType === 'quote' ? 'Добиј понуду' : leadType === 'callback' ? 'Затражи позив' : 'Пошаљи поруку',
      submitting: 'Слање...',
      success: 'Хвала! Јавићемо вам се ускоро.',
      errorName: 'Молимо унесите име',
      errorContact: 'Молимо унесите имејл или телефон',
      errorEmail: 'Молимо унесите валидан имејл',
      errorPhone: 'Молимо унесите валидан број телефона',
    },
    fr: {
      title: leadType === 'quote' ? 'Obtenir un Devis Gratuit' : leadType === 'callback' ? 'Demander un Rappel' : 'Contactez-nous',
      subtitle: businessName ? `Envoyer un message à ${businessName}` : 'Remplissez le formulaire',
      name: 'Votre Nom',
      email: 'Adresse E-mail',
      phone: 'Numéro de Téléphone',
      company: 'Entreprise (Optionnel)',
      message: 'Votre Message',
      submit: leadType === 'quote' ? 'Obtenir Devis' : leadType === 'callback' ? 'Demander Rappel' : 'Envoyer Message',
      submitting: 'Envoi...',
      success: 'Merci ! Nous vous contacterons bientôt.',
      errorName: 'Veuillez entrer votre nom',
      errorContact: 'Veuillez entrer email ou téléphone',
      errorEmail: 'Veuillez entrer un email valide',
      errorPhone: 'Veuillez entrer un numéro valide',
    },
  };

  const txt = translations[lang];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = txt.errorName;
    }

    if (!formData.email && !formData.phone) {
      newErrors.contact = txt.errorContact;
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = txt.errorEmail;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = txt.errorPhone;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    trackFormInteraction('lead_capture', 'submit', undefined, businessId);

    if (!validate()) return;

    setIsSubmitting(true);

    const leadData: LeadData = {
      businessId,
      cityId,
      categoryId,
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      company: formData.company.trim() || undefined,
      message: formData.message.trim() || undefined,
      leadType,
      language: lang,
    };

    const result = await submitLead(leadData);

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      trackCTAClick(`lead_${leadType}_success`, businessId);
      if (onSuccess && result.leadId) {
        onSuccess(result.leadId);
      }
    } else {
      setErrors({ submit: result.error || 'Failed to submit' });
    }
  };

  const handleFocus = (field: string) => {
    trackFormInteraction('lead_capture', 'field_focus', field, businessId);
  };

  if (isSuccess) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-6 text-center ${variant === 'compact' ? 'p-4' : ''}`}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-green-800 font-medium">{txt.success}</p>
      </div>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isCompact ? 'p-4' : 'p-6'}`}>
      <div className="mb-4">
        <h3 className={`font-semibold text-gray-900 ${isCompact ? 'text-lg' : 'text-xl'}`}>
          {txt.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{txt.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {txt.name} *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={() => handleFocus('name')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={txt.name}
            />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email & Phone Row */}
        <div className={isCompact ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              {txt.email}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => handleFocus('email')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email || errors.contact ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              {txt.phone}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onFocus={() => handleFocus('phone')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone || errors.contact ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="(555) 123-4567"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>
        {errors.contact && <p className="text-red-500 text-xs">{errors.contact}</p>}

        {/* Company (optional) */}
        {!isCompact && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              {txt.company}
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              onFocus={() => handleFocus('company')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={txt.company}
            />
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            {txt.message}
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            onFocus={() => handleFocus('message')}
            rows={isCompact ? 2 : 4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder={txt.message}
          />
        </div>

        {errors.submit && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errors.submit}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {txt.submitting}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {txt.submit}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
