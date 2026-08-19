import 'package:flutter/material.dart';

class BookingCodeForm extends StatelessWidget {
  const BookingCodeForm({
    super.key,
    required this.controller,
    required this.loading,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final bool loading;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          key: const Key('bookingCodeField'),
          controller: controller,
          enabled: !loading,
          textInputAction: TextInputAction.done,
          autocorrect: false,
          enableSuggestions: false,
          spellCheckConfiguration: const SpellCheckConfiguration.disabled(),
          decoration: const InputDecoration(
            labelText: 'Booking code',
            hintText: 'BW...',
          ),
          onSubmitted: (_) {
            if (!loading && controller.text.trim().isNotEmpty) {
              onSubmit();
            }
          },
        ),
        const SizedBox(height: 16),
        FilledButton(
          key: const Key('decodeButton'),
          onPressed: loading || controller.text.trim().isEmpty ? null : onSubmit,
          child: loading
              ? const SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(
                    key: Key('decodeProgress'),
                    strokeWidth: 2.5,
                    color: Colors.white,
                  ),
                )
              : const Text('Decode slip'),
        ),
      ],
    );
  }
}
